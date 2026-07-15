import { prisma } from "../../config/database.js";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus } from "../../types/general.js";

export interface IOrderRepository {
  createOrder(orderData: OrderDTO): Promise<any>;
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
  deleteOrder(orderId: string): Promise<any>;
}

export class OrderRepository implements IOrderRepository {
  async createOrder(orderData: OrderDTO) {
    return await prisma.order.create({
      data: orderData,
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
        user: {
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
      where: { userId },
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
      where: { id: orderId, userId },
      data: { status },
    });
  }

  async updateOrderStatusByTransaction(orderId: string, status: OrderStatus) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async deleteOrder(orderId: string) {
    return await prisma.order.delete({
      where: { id: orderId },
    });
  }
}
