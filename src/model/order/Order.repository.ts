import { prisma } from "../../config/database.js";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus, PrismaTx } from "../../types/general.js";

export interface IOrderRepository {
  createOrder(orderData: OrderDTO, tx?: PrismaTx): Promise<any>;

  getOrders(skip: number, take: number, tx?: PrismaTx): Promise<any[]>;
  getUserOrders(
    userId: string,
    skip: number,
    take: number,
    tx?: PrismaTx,
  ): Promise<any[]>;
  countOrders(tx?: PrismaTx): Promise<number>;
  findOrderById(orderId: string, tx?: PrismaTx): Promise<any | null>;
  updateOrder(
    orderId: string,
    orderData: Partial<OrderDTO>,
    tx?: PrismaTx,
  ): Promise<any>;
  updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    tx?: PrismaTx,
  ): Promise<any>;
  updateOrderStatusByTransaction(
    orderId: string,
    status: OrderStatus,
    tx?: PrismaTx,
  ): Promise<any>;
  assignOrder: (
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ) => Promise<any>;
  getOrderStatus(orderId: string, tx?: PrismaTx): Promise<OrderStatus | null>;
  deleteOrder(orderId: string, tx?: PrismaTx): Promise<any>;
  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
}

export class OrderRepository implements IOrderRepository {
  async transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return await prisma.$transaction(fn);
  }

  async createOrder(orderData: OrderDTO, tx: PrismaTx = prisma) {
    return await tx.order.create({
      data: {
        customerId: orderData.customerId,
        unitPrice: orderData.unitPrice,
        stationId: orderData.stationId,
        status: orderData.status,
        fuelType: orderData.fuelType,
        quantity: orderData.quantity,
        VAT: orderData.VAT,
        deliveryFee: orderData.deliveryFee,
        fuelSubtotal: orderData.fuelSubtotal,
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getOrders(skip: number, take: number, tx: PrismaTx = prisma) {
    return await tx.order.findMany({
      skip,
      take,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            userProfile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getUserOrders(
    userId: string,
    skip: number,
    take: number,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.findMany({
      where: { customerId: userId },
      skip,
      take,
      include: {
        station: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countOrders(tx: PrismaTx = prisma) {
    return await tx.order.count();
  }

  async findOrderById(orderId: string, tx: PrismaTx = prisma) {
    return await tx.order.findUnique({
      where: { id: orderId },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            addressCity: true,
            addressState: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async updateOrder(
    orderId: string,
    orderData: Partial<OrderDTO>,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId },
      data: orderData,
    });
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId, customerId: userId },
      data: { status },
    });
  }

  async updateOrderStatusByTransaction(
    orderId: string,
    status: OrderStatus,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async getOrderStatus(
    orderId: string,
    tx: PrismaTx = prisma,
  ): Promise<OrderStatus | null> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order ? (order.status as unknown as OrderStatus) : null;
  }

  async deleteOrder(orderId: string, tx: PrismaTx = prisma) {
    return await tx.order.delete({
      where: { id: orderId },
    });
  }
  async assignOrder(orderId: string, agentId: string, tx: PrismaTx = prisma) {
    return await tx.order.update({
      where: { id: orderId },
      data: { agentId, status: "ASSIGNED" },
    });
  }
  async getUnassignedOrders(tx: PrismaTx = prisma) {
    return tx.order.findMany({
      where: {
        agentId: null,
        status: "PENDING_CONFIRMATION",
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}
