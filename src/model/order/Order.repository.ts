import { prisma } from "../../config/database.js";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus, PrismaTx } from "../../types/general.js";

export interface IOrderRepository {
  createOrder(orderData: OrderDTO, tx?: PrismaTx): Promise<any>;

  getOrders({
    skip,
    take,
    stationId,
    agentId,
    tx,
  }: {
    skip: number;
    take: number;
    stationId?: string;
    agentId?: string;
    tx?: PrismaTx;
  }): Promise<any[]>;
  pendingOrder(
    stationId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<number>;
  getUserOrders(
    userId: string,
    skip: number,
    take: number,
    tx?: PrismaTx,
  ): Promise<any[]>;

  countOrders(
    filters?: { stationId?: string; agentId?: string },
    tx?: PrismaTx,
  ): Promise<number>;

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

  assignOrder(orderId: string, agentId: string, tx?: PrismaTx): Promise<any>;

  getOrderStatus(orderId: string, tx?: PrismaTx): Promise<OrderStatus | null>;
  deleteOrder(orderId: string, tx?: PrismaTx): Promise<any>;

  getUnassignedOrders(tx?: PrismaTx): Promise<any[]>;

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T>;
  completeOrderByAgent(
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<any>;
  cancelOrderByAgent(
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<any>;
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

  async getOrders({
    skip,
    take,
    stationId,
    agentId,
    tx = prisma,
  }: {
    skip: number;
    take: number;
    stationId?: string;
    agentId?: string;
    tx?: PrismaTx;
  }) {
    const whereClause: { stationId?: string; assignedAgentId?: string } = {};

    if (stationId) whereClause.stationId = stationId;
    if (agentId) whereClause.assignedAgentId = agentId;

    return await tx.order.findMany({
      where: whereClause,
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

  // Inside OrderRepository class:
  async countOrders(
    filters?: { stationId?: string; agentId?: string },
    tx: PrismaTx = prisma,
  ): Promise<number> {
    const whereClause: { stationId?: string; assignedAgentId?: string } = {};

    if (filters?.stationId) whereClause.stationId = filters.stationId;
    if (filters?.agentId) whereClause.assignedAgentId = filters.agentId;

    return await tx.order.count({
      where: whereClause,
    });
  }

  async pendingOrder(
    stationId: string,
    agentId: string,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.count({
      where: {
        // stationId,
        assignedAgentId: agentId,
        // status: "PENDING_CONFIRMATION",
      },
    });
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
            userProfile: {
              select: {
                phoneNumber: true,
              },
            },
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
      data: { assignedAgentId: agentId },
    });
  }
  async assignOrderToDriver(
    orderId: string,
    agentId: string,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId },
      data: { driverId: agentId, status: "ASSIGNED" },
    });
  }

  async getUnassignedOrders(tx: PrismaTx = prisma, limit = 20) {
    return await tx.order.findMany({
      where: {
        assignedAgentId: null,
        status: "PENDING_CONFIRMATION",
      },
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
    });
  }
  async completeOrderByAgent(
    orderId: string,
    agentId: string,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId, assignedAgentId: agentId },
      data: {
        status: "COMPLETED",
        completedById: agentId,
        assignedAgentId: null,
      },
    });
  }
  async cancelOrderByAgent(
    orderId: string,
    agentId: string,
    tx: PrismaTx = prisma,
  ) {
    return await tx.order.update({
      where: { id: orderId, assignedAgentId: agentId },
      data: {
        status: "CANCELLED",
        cancelledById: agentId,
        assignedAgentId: null,
      },
    });
  }
}

const orderRepository = new OrderRepository();
export default orderRepository;
