import { Request, Response } from "express";
import crypto from "crypto";
import config from "../config/config.js";
import { PaystackWebhookEvent } from "../interface/paystack.interface.js";
import { TransactionService } from "../model/Transaction/Transaction.service.js";
import { TransactionRepo } from "../model/Transaction/Transaction.repository.js";
import { PayStack } from "../config/paystack.config.js";
import { OrderService } from "../model/order/Order.service.js";
import { OrderRepository } from "../model/order/Order.repository.js";
import { UserRepository } from "../model/user/user.repository.js";

// Component instantiation
const transactionRepo = new TransactionRepo();
const paymentGateway = new PayStack();
const userRepository = new UserRepository();
const transactionService = new TransactionService(
  transactionRepo,
  paymentGateway,
);

const orderRepo = new OrderRepository();
const orderService = new OrderService(
  orderRepo,
  userRepository,
  transactionService,
);

export const webhook = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // 1. Defensively validate signature using pristine Raw Buffer to avoid serialization issues
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(401);
    }

    const event = req.body as PaystackWebhookEvent;

    switch (event.event) {
      case "charge.success": {
        const reference = event.data.reference;

        // 2. Fetch targeted transaction
        const transaction =
          await transactionService.findTransactionByReference(reference);

        // Return 200 early if missing (prevents Paystack from retrying unresolvable entries)
        if (!transaction) {
          return res.sendStatus(200);
        }

        // 3. Idempotency Guard: Stop handling if the payment has already been captured and processed
        if (transaction.status === "COMPLETED") {
          return res.sendStatus(200);
        }

        // 4. Verification & State Updating Orchestration
        await transactionService.verify(reference);

        await transactionService.updateTransactionByReference(reference, {
          paidAt: new Date().toISOString(),
          status: "COMPLETED",
        });

        await orderService.updateOrderStatusByTransaction(
          transaction.orderId as string,
          "CONFIRMED",
        );

        break;
      }

      default:
        // Acknowledge unhandled event types silently to prevent retry storming
        return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (error) {
    // 5. Catch-all Operational Safety Guard: Log issue locally, notify gateway to retry later
    console.error(`[Webhook Process Error]:`, error);

    // Return 500 so Paystack understands a transient problem occurred and retries the webhook
    return res.sendStatus(500);
  }
};
