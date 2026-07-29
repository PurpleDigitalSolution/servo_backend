import { prisma } from "../../config/database.js";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus, PrismaTx } from "../../types/general.js";

export interface IOrderRepository {
  createOrder(orderData: OrderDTO, tx?: PrismaTx): Promise<any>;
  getOrders(skip: number, take: number): Promise<any[]>;
  getUserOrders(userId: string, skip: number, take: number): Promise<any[]>;
  countOrders(): Promise<number>;
  findOrderById(orderId: string): Promise<any | null>;
  updateOrder(orderId: string, orderData: Partial<OrderDTO>): Promise<any>;
  updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<any>;
  updateOrderStatusByTransaction(
    orderId: string,
    status: OrderStatus,
  ): Promise<any>;
  getOrderStatus(orderId: string): Promise<OrderStatus | null>;
  deleteOrder(orderId: string): Promise<any>;
}

export class OrderRepository implements IOrderRepository {
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

  async getOrders(skip: number, take: number) {
    return await prisma.order.findMany({
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

  async getUserOrders(userId: string, skip: number, take: number) {
    return await prisma.order.findMany({
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

  async countOrders() {
    return await prisma.order.count();
  }

  async findOrderById(orderId: string) {
    return await prisma.order.findUnique({
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

  async updateOrder(orderId: string, orderData: Partial<OrderDTO>) {
    return await prisma.order.update({
      where: { id: orderId },
      data: orderData,
    });
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    return await prisma.order.update({
      where: { id: orderId, customerId: userId },
      data: { status },
    });
  }

  async updateOrderStatusByTransaction(orderId: string, status: OrderStatus) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
  async getOrderStatus(orderId: string): Promise<OrderStatus | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order ? (order.status as unknown as OrderStatus) : null;
  }
  async deleteOrder(orderId: string) {
    return await prisma.order.delete({
      where: { id: orderId },
    });
  }
}
