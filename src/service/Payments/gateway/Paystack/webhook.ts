import crypto from "crypto";
import { Request, Response } from "express";
import { Prisma } from "../../../../generated/prisma/client.js";
import { config } from "../../../../config/config.js";
import { prisma } from "../../../../config/database.js";
import { PaystackWebhookEvent } from "../../../../interface/paystack.interface.js";
import { OrderRepository } from "../../../../model/order/Order.repository.js";
import { TransactionRepository } from "../../../../model/Transaction/Transaction.repository.js";

// Component instantiation
const transactionRepo = new TransactionRepository();
const orderRepo = new OrderRepository();

export const paystackWebhook = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // 1. Verify Raw Body exists
    const rawBody = (req as any).rawBody;
    const paystackSignature = req.headers["x-paystack-signature"] as string;

    if (!rawBody || !paystackSignature) {
      return res
        .status(401)
        .send("Missing raw body or Paystack signature header.");
    }

    // 2. Timing-Safe Signature Verification
    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    const hashBuffer = Buffer.from(hash, "utf-8");
    const signatureBuffer = Buffer.from(paystackSignature, "utf-8");

    if (
      hashBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, signatureBuffer)
    ) {
      return res.status(401).send("Invalid Paystack signature.");
    }

    const event = req.body as PaystackWebhookEvent;

    // 3. Handle Supported Events
    switch (event.event) {
      case "charge.success": {
        const reference = event.data.reference;

        const transaction = await transactionRepo.findByReference(reference);

        if (!transaction) {
          // Send 200 so Paystack doesn't re-send non-existent system records
          return res
            .status(200)
            .send("Transaction reference not found; ignored.");
        }

        // Idempotency check on Transaction level
        if (
          transaction.status === "COMPLETED" ||
          transaction.status === "FAILED"
        ) {
          return res.status(200).send("Transaction already processed.");
        }

        const isSuccess =
          event.data.status === "success" || event.data.status === "successful";

        if (!isSuccess) {
          const failureReason =
            event.data.gateway_response ||
            event.data.message ||
            "Payment failed or was cancelled";

          // Atomic execution for payment failure
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

          return res.status(200).send("Failed payment recorded.");
        }

        // Fetch Order details for idempotency check on Order level
        if (transaction.orderId) {
          const order = await orderRepo.findOrderById(transaction.orderId);
          if (order && order.status !== "PENDING_PAYMENT") {
            // Short-circuit if order is already processed or past payment stage
            return res
              .status(200)
              .send("Order status already updated by another process.");
          }
        }

        // Atomic Transaction Execution for Successful Payment
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

        return res.status(200).send("Charge processed successfully.");
      }

      default:
        return res.status(200).send("Unhandled event type ignored.");
    }
  } catch (error) {
    console.error("[Paystack Webhook Process Error]:", error);

    // Handle database race conditions gracefully without triggering retries
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      return res
        .status(200)
        .send("Order was already completed by a parallel process.");
    }

    // Unhandled application errors return 500 to allow Paystack retry logic
    return res.status(500).send("Internal Server Error");
  }
};
