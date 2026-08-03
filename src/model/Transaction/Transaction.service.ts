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
    // Do NOT multiply by 100 here! Pass raw amount to paymentService,
    // let each Gateway handle unit conversions (e.g., Paystack * 100).
    const amount = payload.amount;

    try {
      // 1. Record pending transaction locally
      await this.transactionRepo.record(
        {
          orderId: payload.orderId,
          reference,
          amount,
          paymentMethod: payload.provider, // ✅ Dynamic provider
          authorizationUrl: "",
        },
        payload.tx,
      );

      // 2. Initialize with Payment Gateway
      const _res = await this.paymentService.initialize(
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

      const { authorization_url } = _res.data;

      // 3. Update local transaction with payment gateway link
      await this.transactionRepo.updateAuthorizationUrl(
        reference,
        authorization_url,
        payload.tx,
      );

      return {
        authorizationUrl: authorization_url,
        reference,
      };
    } catch (error) {
      console.error(error);
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
    let paymentMethod: providerType = "PAYSTACK";
    if (!targetReference && params.orderId) {
      const transaction = await this.transactionRepo.findPendingByOrderId(
        params.orderId,
      );

      if (!transaction) {
        throw new ApiError(404, `No pending transaction found for this Order`);
      }

      targetReference = transaction.reference;
      paymentMethod = transaction.paymentMethod;
    }

    if (!targetReference) {
      throw new ApiError(
        400,
        "Either 'reference' or 'orderId' must be provided for verification.",
      );
    }

    try {
      const response = await this.paymentService.verify(
        targetReference,
        paymentMethod,
      );

      // ✅ Normalize checking status (successful or success)
      const isSuccessful =
        response.status === "successful" || response.status === "success";

      if (isSuccessful) {
        await this.updateTransactionByReference(targetReference, {
          paidAt: new Date().toISOString(),
          status: "COMPLETED",
        });
      }

      return {
        status: isSuccessful ? "SUCCESSFUL" : "FAILED",
        reference: targetReference,
        message: isSuccessful
          ? "Transaction verified successfully"
          : "Transaction verification failed",
      };
    } catch (error: Error | any) {
      if (error instanceof ApiError) throw error;
      console.log(error);
      const message =
        error.message || "An error occurred during transaction verification.";
      throw new ApiError(
        500,
        message,
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
    return await this.transactionRepo.updateTransaction(reference, data);
  }

  async findTransactionByOrderId(orderId: string): Promise<any | null> {
    return await this.transactionRepo.findByOrderId(orderId);
  }

  // ✅ Fixed method
  async findPendingTransactionByOrderId(
    orderId: string,
    provider: providerType = "PAYSTACK",
  ): Promise<any | null> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const transaction =
      await this.transactionRepo.findPendingByOrderId(orderId);

    if (!transaction) {
      return await this.initialize({
        orderId,
        amount: order.totalAmount,
        email: order.customer.email,
        name: order.customer.name || order.customer.email, // ✅ Use name if available
        provider,
      });
    }

    return transaction;
  }
}
