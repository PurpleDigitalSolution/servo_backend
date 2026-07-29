import { IPaymentGateway } from "../../config/paystack.config.js";
import { TransactionUpdateDTO } from "../../interface/dto/transaction.dto.js";
import { PrismaTx } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";
import { generateTransactionReference } from "../../utils/generator.js";
import { IOrderRepository } from "../order/Order.repository.js";
import { ITransactionRepository } from "./Transaction.repository.js";

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly payStack: IPaymentGateway,
    private readonly orderRepository: IOrderRepository,
  ) {}

  async initialize(
    orderId: string,
    amount: number,
    email: string,
    tx?: PrismaTx,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    if (!email || !email.includes("@")) {
      throw new ApiError(
        400,
        "A valid email address is required for transaction initialization.",
      );
    }

    const reference = generateTransactionReference();
    const serializedAmount = Math.round(amount * 100);

    try {
      // 2. Use the injected instance variable
      await this.transactionRepo.record(
        {
          orderId,
          reference,
          amount: serializedAmount,
          paymentMethod: "PAYSTACK",
          authorizationUrl: "",
        },
        tx,
      );

      const _response = await this.payStack.initializeTransaction({
        amount: serializedAmount,
        email,
        reference,
        metadata: {
          orderId,
          reference_id: reference,
        },
      });

      const { authorization_url } = _response.data;

      // Update local storage record with the definitive payment url returned by Paystack
      await this.transactionRepo.updateAuthorizationUrl(
        reference,
        authorization_url,
        tx,
      );

      return {
        authorizationUrl: authorization_url,
        reference,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
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

    if (!targetReference && params.orderId) {
      const transaction = await this.transactionRepo.findPendingByOrderId(
        params.orderId,
      );

      if (!transaction) {
        throw new ApiError(404, `No pending transaction found for this Order`);
      }

      targetReference = transaction.reference;
    }

    if (!targetReference) {
      throw new ApiError(
        400,
        "Either 'reference' or 'orderId' must be provided for verification.",
      );
    }

    try {
      const response = await this.payStack.verifyTransaction(targetReference);

      if (response.data.status === "success") {
        await this.updateTransactionByReference(targetReference, {
          paidAt: new Date().toISOString(),
          status: "COMPLETED",
        });
      }

      return {
        status: response.data.status,
        reference: targetReference,
        message: response.status
          ? "Transaction verified successfully"
          : "Transaction verification failed",
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw new ApiError(
        500,
        "Failed to verify transaction.",
        [error],
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
  /**
   * Locates a transaction record by its unique reference string.
   * @throws {Error} If the database query encounters a structural failure.
   * @returns {Promise<any | null>} The transaction payload data structure, or null if not found.
   */
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
  async findPendingTransactionByOrderId(orderId: string): Promise<any | null> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    const transaction =
      await this.transactionRepo.findPendingByOrderId(orderId);
    if (!transaction) {
      const newTransaction = await this.initialize(
        orderId,
        order.totalAmount,
        order.customer.email,
      );
      return newTransaction;
    }
    return transaction;
  }
}
