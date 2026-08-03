import { PrismaClient } from "../../generated/prisma/client.js";
import { OrderDTO, OrderResponseDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";
import {
  canTransition,
  isRoleAllowedToSetStatus,
  UserRole,
} from "../../utils/status.js";
import { IStationRepository } from "../station/Station.repository.js";
import { TransactionService } from "../Transaction/Transaction.service.js";
import { IOrderRepository } from "./Order.repository.js";

// Basic interface descriptions to ensure structural alignment with injected user repo instance
export interface IUserRepository {
  findUserById(userId: string): Promise<any | null>;
}
export interface ActorContext {
  id: string;
  role: UserRole;
}

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository,
    private readonly transactionService: TransactionService,
    private readonly stationRepository: IStationRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async createOrder(orderData: OrderDTO): Promise<OrderResponseDTO> {
    const { customerId, stationId, quantity, unitPrice } = orderData;

    if (quantity <= 0 || unitPrice <= 0) {
      throw new ApiError(
        400,
        "Quantity and unit price must be positive numbers.",
      );
    }

    // 2. Parallel Dependency Check (Fast-Fail Layer)
    const [user, station] = await Promise.all([
      this.userRepository.findUserById(customerId),
      this.stationRepository.findStationById(stationId),
    ]);

    if (!user) throw new ApiError(404, "Target customer profile not found.");
    if (!station) throw new ApiError(404, "Target filling station not found.");

    // 3. Server-Controlled Calculations (Mitigates Client-Side Pricing Manipulation)
    // TODO: Pull these rules dynamically from a config service table mapped to the station location
    const vatRate = 0.075; // Example: 7.5% baseline tax
    const baselineDeliveryFee = 15.0;

    const fuelSubtotal = quantity * unitPrice;
    const calculatedVat = Number((fuelSubtotal * vatRate).toFixed(2));
    const totalAmount = Number(
      (fuelSubtotal + calculatedVat + baselineDeliveryFee).toFixed(2),
    );

    // 4. Atomic Execution Block (Protects Against Orphaned Records)
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        // Save order using transactional context
        const order = await this.orderRepository.createOrder(
          {
            ...orderData,
            fuelSubtotal,
            VAT: calculatedVat,
            deliveryFee: baselineDeliveryFee,
            totalAmount,
          },
          tx,
        );

        // Remote financial initialization gate
        const transaction = await this.transactionService.initialize({
          orderId: order.id,
          amount: totalAmount,
          name: user.name,
          email: user.email,
          provider: orderData.provider || "PAYSTACK",
          tx,
        });

        return {
          ...order,
          payResponse: {
            orderId: order.id,
            authorizationUrl: transaction.authorizationUrl,
            reference: transaction.reference,
          },
        };
      });
    } catch (error: any) {
      // Clean handling of explicit engine exceptions
      if (error instanceof ApiError) throw error;

      if (
        error.code === "P2003" ||
        error.code === "23503" ||
        error.message?.includes("foreign key")
      ) {
        throw new ApiError(
          400,
          "Order creation aborted: Invalid relational reference keys supplied.",
        );
      }

      throw new ApiError(
        500,
        `Order processing critical error: ${error.message || error}`,
      );
    }
  }

  async listOrders(
    page: number,
    limit: number,
  ): Promise<{ page: number; limit: number; total: number; orders: any[] }> {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [orderCount, orders] = await Promise.all([
      this.orderRepository.countOrders(),
      this.orderRepository.getOrders(skip, take),
    ]);

    const results = {
      page: pageNum,
      limit: take,
      total: orderCount,
    };

    return { ...results, orders: orders };
  }

  async getUserOrders(
    userId: string,
    page: number,
    limit: number,
  ): Promise<any[]> {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    return await this.orderRepository.getUserOrders(userId, skip, take);
  }

  async findOrderById(orderId: string): Promise<any | null> {
    return this.orderRepository.findOrderById(orderId);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actor: ActorContext,
  ): Promise<any> {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // 2. Ownership / Assignment Access Guard
    if (actor.role === "CUSTOMER" && order.customerId !== actor.id) {
      throw new ApiError(403, "Forbidden: You can only manage your own orders");
    }

    if (actor.role === "AGENT" && order.agentId !== actor.id) {
      throw new ApiError(403, "Forbidden: You are not assigned to this order");
    }

    // 3. Check State Machine Validity (Can the state transition from A -> B?)
    if (!canTransition(order.status, newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${order.status}' to '${newStatus}'`,
      );
    }

    // 4. Check Role Permission (Is this actor allowed to set this target status?)
    if (!isRoleAllowedToSetStatus(actor.role, newStatus)) {
      throw new ApiError(
        403,
        `Forbidden: '${actor.role}' role is not authorized to transition orders to '${newStatus}'`,
      );
    }

    // 5. Execute Update
    return await this.orderRepository.updateOrderStatus(
      order.customerId,
      orderId,
      newStatus,
    );
  }

  async updateOrderStatusByTransaction(
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    try {
      const res = await this.orderRepository.updateOrderStatusByTransaction(
        orderId,
        status,
      );
      if (!res) {
        throw new ApiError(404, "Order not found");
      }
    } catch (error: any) {
      if (
        error.code === "23503" ||
        error.message?.includes("foreign key constraint")
      ) {
        throw new ApiError(404, "User not found");
      }
      throw error;
    }
  }
}
