import crypto from "crypto";
import { Request, Response } from "express";
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
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    const paystackSignature = req.headers["x-paystack-signature"];

    if (!paystackSignature || hash !== paystackSignature) {
      return res.status(401).send("Invalid Paystack signature");
    }

    const event = req.body as PaystackWebhookEvent;

    switch (event.event) {
      case "charge.success": {
        const reference = event.data.reference;

        const transaction =
          await transactionService.findTransactionByReference(reference);

        if (!transaction) {
          return res.sendStatus(200);
        }

        if (
          transaction.status === "COMPLETED" ||
          transaction.status === "FAILED"
        ) {
          return res.sendStatus(200);
        }

        const isSuccess =
          event.data.status === "success" || event.data.status === "successful";

        if (!isSuccess) {
          const failureReason =
            event.data.message || "Payment failed or was cancelled";

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

          return res.sendStatus(200);
        }

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

        break;
      }

      default:
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(`[Paystack Webhook Process Error]:`, error);
    return res.sendStatus(500);
  }
};
