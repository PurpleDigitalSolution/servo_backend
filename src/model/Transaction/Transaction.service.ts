import config from "../../config/config.js";
import { TransactionUpdateDTO } from "../../interface/dto/transaction.dto.js";
import { IPaymentService } from "../../service/Payments/payment.service.js";
import { PrismaTx, providerType } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";
import { generateTransactionReference } from "../../utils/generator.js";
import { IOrderRepository } from "../order/Order.repository.js";
import { ITransactionRepository } from "./Transaction.repository.js";

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly paymentService: IPaymentService,
    private readonly orderRepository: IOrderRepository,
  ) {}

  async initialize(payload: {
    orderId: string;
    amount: number;
    email: string;
    name: string;
    provider: providerType;
    tx?: PrismaTx;
  }): Promise<{ authorizationUrl: string; reference: string }> {
    if (!payload.email || !payload.email.includes("@")) {
      throw new ApiError(
        400,
        "A valid email address is required for transaction initialization.",
      );
    }

    const reference = generateTransactionReference();
    const amount = payload.amount;

    try {
      // 1. Initialize with Payment Gateway FIRST
      const gatewayResponse = await this.paymentService.initialize(
        {
          amount,
          tx_ref: reference,
          redirect_url: config.PAYMENT_REDIRECT_URL,
          customer: {
            email: payload.email,
            name: payload.name,
          },
          metadata: {
            orderId: payload.orderId,
            reference_id: reference,
          },
        },
        payload.provider,
      );

      const authorizationUrl = gatewayResponse.data.authorization_url;

      // 2. Atomic record in local DB once gateway confirms authorization URL
      await this.transactionRepo.createTransaction(
        {
          orderId: payload.orderId,
          reference,
          amount,
          paymentMethod: payload.provider,
          authorizationUrl,
        },
        payload.tx,
      );

      return {
        authorizationUrl,
        reference,
      };
    } catch (error) {
      console.error("Transaction initialization failed:", error);
      if (error instanceof ApiError) throw error;

      throw new ApiError(
        500,
        "Failed to initialize transaction.",
        [error],
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async verify(params: {
    reference?: string;
    orderId?: string;
  }): Promise<{ status: string; reference: string; message?: string }> {
    let targetReference = params.reference;
    let transaction: any = null;

    // 1. RESOLVE TRANSACTION
    if (targetReference) {
      transaction = await this.transactionRepo.findByReference(targetReference);
    } else if (params.orderId) {
      const transactions = await this.transactionRepo.findByOrderId(
        params.orderId,
      );

      // A. Check if ANY transaction for this order is already COMPLETED
      transaction = transactions.find((tx) => tx.status === "COMPLETED");

      // B. If none completed, pick the most recent PENDING attempt
      if (!transaction) {
        transaction = transactions.find((tx) => tx.status === "PENDING");
      }
    }

    if (!transaction) {
      throw new ApiError(
        404,
        "No active or valid transaction found matching the provided reference or order ID.",
      );
    }

    targetReference = transaction.reference;
    const paymentMethod: providerType = transaction.paymentMethod;

    // 2. FETCH ASSOCIATED ORDER
    const order = await this.orderRepository.findOrderById(transaction.orderId);
    if (!order) {
      throw new ApiError(404, "Associated order not found.");
    }

    // 3. EARLY RETURN / SELF-HEALING: If transaction is already COMPLETED
    if (transaction.status === "COMPLETED") {
      // Catch-up check: Heal order state if transaction succeeded but order status was left behind
      if (order.status === "PENDING_PAYMENT") {
        await this.orderRepository.updateOrderStatus(
          order.userId,
          order.id,
          "PENDING_CONFIRMATION",
        );
      }

      return {
        status: "SUCCESSFUL",
        reference: targetReference as string,
        message: "Order has already been successfully paid and verified.",
      };
    }

    // 4. EARLY RETURN: If order has already advanced past payment (e.g. by webhook)
    if (order.status !== "PENDING_PAYMENT") {
      return {
        status: "SUCCESSFUL",
        reference: targetReference as string,
        message: `Order status is already ${order.status}.`,
      };
    }

    try {
      // 5. VERIFY WITH PAYMENT PROVIDER
      const response = await this.paymentService.verify(
        targetReference as string,
        paymentMethod,
      );

      const isSuccessful =
        response.status === "successful" || response.status === "success";

      if (isSuccessful) {
        // 6. ATOMIC DB TRANSACTION UPDATE
        await this.orderRepository.transaction(async (tx: PrismaTx) => {
          // Mark current transaction COMPLETED
          await this.transactionRepo.updateTransactionByReference(
            targetReference as string,
            {
              paidAt: new Date().toISOString(),
              status: "COMPLETED",
            },
            tx,
          );

          // Advance order state if still in PENDING_PAYMENT
          if (order.status === "PENDING_PAYMENT") {
            await this.orderRepository.updateOrderStatus(
              order.userId,
              transaction.orderId,
              "PENDING_CONFIRMATION",
              tx,
            );
          }
        });
      } else {
        await this.transactionRepo.updateTransactionByReference(
          targetReference as string,
          {
            status: "FAILED",
          },
        );
      }

      return {
        status: isSuccessful ? "SUCCESSFUL" : "FAILED",
        reference: targetReference as string,
        message: isSuccessful
          ? "Transaction verified successfully"
          : "Transaction verification failed",
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      console.error("Verification error:", error);

      throw new ApiError(
        500,
        error.message || "An error occurred during transaction verification.",
        [error],
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async findTransactionByReference(reference: string): Promise<any | null> {
    return await this.transactionRepo.findByReference(reference);
  }

  async updateTransactionByReference(
    reference: string,
    data: TransactionUpdateDTO,
  ) {
    return await this.transactionRepo.updateTransactionByReference(
      reference,
      data,
    );
  }

  async findTransactionByOrderId(orderId: string): Promise<any | null> {
    return await this.transactionRepo.findByOrderId(orderId);
  }

  async findPendingTransactionByOrderId(
    orderId: string,
    provider: providerType = "PAYSTACK",
  ): Promise<any> {
    // 1. Check if the order exists and its current status
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // 2. Prevent payment if the order itself is already paid/processing
    if (order.status !== "PENDING_PAYMENT") {
      throw new ApiError(
        400,
        `This order has already been paid or processed (Status: ${order.status}).`,
      );
    }

    // 3. Fetch all transactions associated with this order
    const transactions = await this.transactionRepo.findByOrderId(orderId);

    if (Array.isArray(transactions) && transactions.length > 0) {
      // Check if ANY transaction for this order is already COMPLETED
      const completedTx = transactions.find((tx) => tx.status === "COMPLETED");
      if (completedTx) {
        throw new ApiError(
          400,
          "A successful payment has already been made for this order.",
        );
      }

      // Check if there is already an active PENDING transaction
      const pendingTx = transactions.find((tx) => tx.status === "PENDING");
      if (pendingTx) {
        return pendingTx; // Return the existing pending transaction
      }
    }

    // 4. Safe to create a new transaction if no active or completed payment exists
    return await this.initialize({
      orderId,
      amount: order.totalAmount,
      email: order.customer.email,
      name: order.customer.name || order.customer.email,
      provider,
    });
  }

  async findUserTransactions(
    userId: string,
    skip: number,
    take: number,
  ): Promise<any[]> {
    const userOrders = await this.orderRepository.getUserOrders(
      userId,
      skip,
      take,
    );
    if (!userOrders.length) return [];

    const orderIds = userOrders.map((order) => order.id);

    // Recommended: delegate batching to repo (e.g. `transactionRepo.findByOrderIds(orderIds)`)
    const transactions = await Promise.all(
      orderIds.map((orderId) => this.transactionRepo.findByOrderId(orderId)),
    );

    return transactions.filter(Boolean);
  }
}
