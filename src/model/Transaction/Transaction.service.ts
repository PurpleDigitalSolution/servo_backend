import { IPaymentGateway } from "../../config/paystack.config.js";
import { TransactionUpdateDTO } from "../../interface/dto/transaction.dto.js";
import { ApiError } from "../../utils/errorHandler.js";
import { generateTransactionReference } from "../../utils/generator.js";
import { ITransactionRepository } from "./Transaction.repository.js";

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly payStack: IPaymentGateway,
  ) {}

  async initialize(
    orderId: string,
    amount: number,
    email: string,
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
      await this.transactionRepo.record({
        orderId,
        reference,
        amount: serializedAmount,
        paymentMethod: "PAYSTACK",
        authorizationUrl: "",
      });

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
  async verify(reference: string): Promise<{ status: string }> {
    try {
      const response = await this.payStack.verifyTransaction(reference);
      return {
        status: response.data.status,
      };
    } catch (error) {
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
}
