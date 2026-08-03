import { Request, Response } from "express";
import { config } from "../../../../config/config.js";
import { FlutterwaveWebhookEvent } from "../../../../interface/flutterwave.interface.js";
import { TransactionService } from "../../../../model/Transaction/Transaction.service.js";
import { TransactionRepo } from "../../../../model/Transaction/Transaction.repository.js";
import { OrderRepository } from "../../../../model/order/Order.repository.js";
import { StationRepository } from "../../../../model/station/Station.repository.js";
import { OrderService } from "../../../../model/order/Order.service.js";
import { UserRepository } from "../../../../model/user/user.repository.js";
import { prisma } from "../../../../config/database.js";
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
    const secretHash = config.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers["verif-hash"];

    if (!signature) {
      return res.status(401).json({
        status: false,
        message: "Missing Flutterwave signature header",
      });
    }

    if (signature !== secretHash) {
      return res.status(401).json({
        status: false,
        message: "Invalid signature. Request source unverified.",
      });
    }
    const event = req.body as FlutterwaveWebhookEvent;
    switch (event.event) {
      case "charge.completed": {
        const reference = event.data.tx_ref;

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

        if (event.data.status !== "successful") {
          const failureReason =
            event.data.processor_response || "Payment failed or was cancelled";

          // Update Transaction
          await transactionService.updateTransactionByReference(reference, {
            status: "FAILED",
            failureReason,
          });

          // Update Order
          if (transaction.orderId) {
            await orderService.updateOrderStatusByTransaction(
              transaction.orderId,
              "PAYMENT_FAILED",
            );
          }

          // (Optional) Send immediate email or push notification
          // await notificationService.sendPaymentFailedEmail(transaction.userId, failureReason);
          return res.sendStatus(200);
        }

        await transactionService.updateTransactionByReference(reference, {
          paidAt: new Date().toISOString(),
          status: "COMPLETED",
        });

        await orderService.updateOrderStatusByTransaction(
          transaction.orderId as string,
          "PENDING_CONFIRMATION",
        );

        break;
      }
      default:
        return res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error processing Flutterwave webhook:", error);
    return res.sendStatus(500);
  }
};
