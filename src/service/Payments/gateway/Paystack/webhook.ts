import crypto from "crypto";
import { Request, Response } from "express";
import { Prisma } from "../../../../generated/prisma/client.js";
import { config } from "../../../../config/config.js";
import { prisma } from "../../../../config/database.js";
import { PaystackWebhookEvent } from "../../../../interface/paystack.interface.js";
import { OrderRepository } from "../../../../model/order/Order.repository.js";
import { OrderService } from "../../../../model/order/Order.service.js";
import { StationRepository } from "../../../../model/station/Station.repository.js";
import { TransactionRepo } from "../../../../model/Transaction/Transaction.repository.js";
import { TransactionService } from "../../../../model/Transaction/Transaction.service.js";
import { UserRepository } from "../../../../model/user/user.repository.js";
import { paymentService } from "../../payment.service.js";

// Component instantiation
const transactionRepo = new TransactionRepo();
const userRepository = new UserRepository();
const orderRepo = new OrderRepository();
const stationRepo = new StationRepository();

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

        const transaction =
          await transactionService.findTransactionByReference(reference);

        if (!transaction) {
          // Send 200 so Paystack doesn't re-send non-existent system records
          return res
            .status(200)
            .send("Transaction reference not found; ignored.");
        }

        // Idempotency check
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

          return res.status(200).send("Failed payment recorded.");
        }

        // Update successful transaction
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
      error.code === "P2002"
    ) {
      return res
        .status(200)
        .send("Order was already completed by a parallel process.");
    }

    // Unhandled application errors return 500 to allow Paystack retry logic
    return res.status(500).send("Internal Server Error");
  }
};
