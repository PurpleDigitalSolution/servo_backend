import { prisma } from "../../config/database.js";
import {
  TransactionDTO,
  TransactionUpdateDTO,
} from "../../interface/dto/transaction.dto.js";
import { PrismaTx } from "../../types/general.js";

// 1. Establish the boundary interface contract
export interface ITransactionRepository {
  record(payload: TransactionDTO, tx?: PrismaTx): Promise<any>;
  updateAuthorizationUrl(
    reference: string,
    authorizationUrl: string,
    tx?: PrismaTx,
  ): Promise<any>;
  findByReference(reference: string): Promise<any | null>;
  findByOrderId(orderId: string): Promise<any | null>;
  updateTransaction(
    reference: string,
    data: TransactionUpdateDTO,
    tx?: PrismaTx,
  ): Promise<any | null>;
  findPendingByOrderId(orderId: string): Promise<any | null>;
}

// 2. Implement the concrete class as an instance mapping
export class TransactionRepo implements ITransactionRepository {
  async record(payload: TransactionDTO, tx: PrismaTx = prisma) {
    return await tx.transaction.create({
      data: {
        orderId: payload.orderId,
        reference: payload.reference,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        authorizationUrl: payload.authorizationUrl,
      },
    });
  }

  async updateAuthorizationUrl(
    reference: string,
    authorizationUrl: string,
    tx: PrismaTx = prisma,
  ) {
    return await tx.transaction.update({
      where: { reference },
      data: { authorizationUrl },
    });
  }

  async findByReference(reference: string) {
    return await prisma.transaction.findUnique({
      where: { reference },
    });
  }

  async findByOrderId(orderId: string) {
    return await prisma.transaction.findMany({
      where: { orderId },
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

  async findPendingByOrderId(orderId: string): Promise<any | null> {
    return await prisma.transaction.findFirst({
      where: {
        orderId,
        status: "PENDING",
      },
    });
  }
}
