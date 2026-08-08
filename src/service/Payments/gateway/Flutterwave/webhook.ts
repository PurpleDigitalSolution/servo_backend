import { Request, Response } from "express";
import { Prisma } from "../../../../generated/prisma/client.js";
import { config } from "../../../../config/config.js";
import { prisma } from "../../../../config/database.js";
import { FlutterwaveWebhookEvent } from "../../../../interface/flutterwave.interface.js";
import { OrderRepository } from "../../../../model/order/Order.repository.js";
import { OrderService } from "../../../../model/order/Order.service.js";
import { StationRepository } from "../../../../model/station/Station.repository.js";
import { TransactionRepo } from "../../../../model/Transaction/Transaction.repository.js";
import { TransactionService } from "../../../../model/Transaction/Transaction.service.js";
import { UserRepository } from "../../../../model/user/user.repository.js";
import { paymentService } from "../../payment.service.js";

const transactionRepo = new TransactionRepo();
const orderRepo = new OrderRepository();
const stationRepo = new StationRepository();
const userRepository = new UserRepository();

const transactionService = new TransactionService(
  transactionRepo,
  paymentService,
  orderRepo,
);

const orderService = new OrderService(
  orderRepo,
  userRepository,
  transactionService,
  stationRepo,
  prisma,
);

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
        const transaction =
          await transactionService.findTransactionByReference(reference);

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

          await transactionService.updateTransactionByReference(reference, {
            status: "FAILED",
            failureReason,
          });

          if (transaction.orderId) {
            await orderService.updateOrderStatusByTransaction(
              transaction.orderId,
              "PAYMENT_FAILED",
            );
          }

          return res.status(200).send("Failed transaction recorded.");
        }

        // 6. Handle Successful Charges
        await transactionService.updateTransactionByReference(reference, {
          paidAt: new Date().toISOString(),
          status: "COMPLETED",
        });

        if (transaction.orderId) {
          await orderService.updateOrderStatusByTransaction(
            transaction.orderId,
            "PENDING_CONFIRMATION",
          );
        }

        return res.status(200).send("Webhook processed successfully.");
      }

      default:
        // Return 200 for unhandled events so Flutterwave stops sending them
        return res.status(200).send("Event type ignored.");
    }
  } catch (error) {
    console.error("Error processing Flutterwave webhook:", error);

    // If duplicate transaction update occurs via P2002, handle gracefully
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
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
