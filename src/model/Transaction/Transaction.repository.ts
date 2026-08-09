import { prisma } from "../../config/database.js";
import {
  TransactionDTO,
  TransactionUpdateDTO,
} from "../../interface/dto/transaction.dto.js";
import {
  PrismaTx,
  PaymentStatus as TransactionStatus,
} from "../../types/general.js";

export interface ITransactionRepository {
  createTransaction(data: TransactionDTO, tx?: PrismaTx): Promise<any>;
  findByReference(reference: string, tx?: PrismaTx): Promise<any | null>;
  findByOrderId(orderId: string, tx?: PrismaTx): Promise<any[]>;
  findPendingByOrderId(orderId: string, tx?: PrismaTx): Promise<any | null>;
  updateTransactionByReference(
    reference: string,
    data: TransactionUpdateDTO,
    tx?: PrismaTx,
  ): Promise<any>;
  updateStatus(
    reference: string,
    status: TransactionStatus,
    tx?: PrismaTx,
  ): Promise<any>;
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}

export class TransactionRepository implements ITransactionRepository {
  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return await prisma.$transaction(fn);
  }

  async createTransaction(data: TransactionDTO, tx: PrismaTx = prisma) {
    return await tx.transaction.create({
      data,
    });
  }

  async findByReference(reference: string, tx: PrismaTx = prisma) {
    return await tx.transaction.findUnique({
      where: { reference },
    });
  }

  async findByOrderId(orderId: string, tx: PrismaTx = prisma) {
    return await tx.transaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPendingByOrderId(orderId: string, tx: PrismaTx = prisma) {
    return await tx.transaction.findFirst({
      where: {
        orderId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTransactionByReference(
    reference: string,
    data: TransactionUpdateDTO,
    tx: PrismaTx = prisma,
  ) {
    return await tx.transaction.update({
      where: { reference },
      data,
    });
  }

  async updateStatus(
    reference: string,
    status: TransactionStatus,
    tx: PrismaTx = prisma,
  ) {
    return await tx.transaction.update({
      where: { reference },
      data: { status },
    });
  }
}
