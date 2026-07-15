import { prisma } from "../../config/database.js";
import {
  TransactionDTO,
  TransactionUpdateDTO,
} from "../../interface/dto/transaction.dto.js";

// 1. Establish the boundary interface contract
export interface ITransactionRepository {
  record(payload: TransactionDTO): Promise<any>;
  updateAuthorizationUrl(
    reference: string,
    authorizationUrl: string,
  ): Promise<any>;
  findByReference(reference: string): Promise<any | null>;
  updateTransaction(
    reference: string,
    data: TransactionUpdateDTO,
  ): Promise<any | null>;
}

// 2. Implement the concrete class as an instance mapping
export class TransactionRepo implements ITransactionRepository {
  async record(payload: TransactionDTO) {
    return await prisma.transaction.create({
      data: {
        orderId: payload.orderId,
        reference: payload.reference,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        authorizationUrl: payload.authorizationUrl,
      },
    });
  }

  async updateAuthorizationUrl(reference: string, authorizationUrl: string) {
    return await prisma.transaction.update({
      where: { reference },
      data: { authorizationUrl },
    });
  }

  async findByReference(reference: string) {
    return await prisma.transaction.findUnique({
      where: { reference },
    });
  }
  async updateTransaction(
    reference: string,
    data: TransactionUpdateDTO,
  ): Promise<any | null> {
    return await prisma.transaction.update({
      where: {
        reference,
      },
      data,
    });
  }
}
