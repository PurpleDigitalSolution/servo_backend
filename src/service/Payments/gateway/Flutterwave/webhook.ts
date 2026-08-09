import { Request, Response } from "express";
import { Prisma } from "../../../../generated/prisma/client.js";
import { config } from "../../../../config/config.js";
import { prisma } from "../../../../config/database.js";
import { FlutterwaveWebhookEvent } from "../../../../interface/flutterwave.interface.js";
import { OrderRepository } from "../../../../model/order/Order.repository.js";
import { TransactionRepository } from "../../../../model/Transaction/Transaction.repository.js";

// Repository instantiation
const transactionRepo = new TransactionRepository();
const orderRepo = new OrderRepository();

export const flutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify Secret Hash Header
    const secretHash = config.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized webhook source.",
      });
    }

    const event = req.body as FlutterwaveWebhookEvent;

    // 2. Handle Event Types
    switch (event.event) {
      case "charge.completed": {
        const reference = event.data.tx_ref;

        // 3. Find target transaction
        const transaction = await transactionRepo.findByReference(reference);

        if (!transaction) {
          // Acknowledge unknown transactions to prevent webhook retries
          return res.status(200).send("Transaction not found; ignored.");
        }

        // 4. Idempotency Check: Ignore already finalized transactions
        if (
          transaction.status === "COMPLETED" ||
          transaction.status === "FAILED"
        ) {
          return res.status(200).send("Transaction already processed.");
        }

        // 5. Handle Failed Charges
        if (event.data.status !== "successful") {
          const failureReason =
            event.data.processor_response || "Payment failed or was cancelled";

          // Atomic execution for failed charges
          await prisma.$transaction(async (tx) => {
            await transactionRepo.updateTransactionByReference(
              reference,
              { status: "FAILED", failureReason },
              tx,
            );

            if (transaction.orderId) {
              await orderRepo.updateOrderStatusByTransaction(
                transaction.orderId,
                "PAYMENT_FAILED",
                tx,
              );
            }
          });

          return res.status(200).send("Failed transaction recorded.");
        }

        // 6. Check Order level status before proceeding
        if (transaction.orderId) {
          const order = await orderRepo.findOrderById(transaction.orderId);
          if (order && order.status !== "PENDING_PAYMENT") {
            // Short-circuit if order is already processed or past payment stage
            return res
              .status(200)
              .send("Order status already updated by another process.");
          }
        }

        // 7. Atomic Execution for Successful Charges
        await prisma.$transaction(async (tx) => {
          await transactionRepo.updateTransactionByReference(
            reference,
            {
              paidAt: new Date().toISOString(),
              status: "COMPLETED",
            },
            tx,
          );

          if (transaction.orderId) {
            await orderRepo.updateOrderStatusByTransaction(
              transaction.orderId,
              "PENDING_CONFIRMATION",
              tx,
            );
          }
        });

        return res.status(200).send("Webhook processed successfully.");
      }

      default:
        // Return 200 for unhandled events so Flutterwave stops sending them
        return res.status(200).send("Event type ignored.");
    }
  } catch (error) {
    console.error("Error processing Flutterwave webhook:", error);

    // Handle database race conditions gracefully without triggering retries
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      return res
        .status(200)
        .send("Order already completed by a parallel process.");
    }

    // Always respond with 500 on server errors so the payment gateway can retry
    return res.status(500).json({
      status: false,
      message: "Internal server error processing webhook",
    });
  }
};
