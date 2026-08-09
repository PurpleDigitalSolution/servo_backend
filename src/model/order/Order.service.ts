import { PrismaClient } from "../../generated/prisma/client.js";
import { OrderDTO, OrderResponseDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus, PrismaTx } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";
import {
  canTransition,
  isRoleAllowedToSetStatus,
  UserRole,
} from "../../utils/status.js";
import { IStationRepository } from "../station/Station.repository.js";
import { ITransactionRepository } from "../Transaction/Transaction.repository.js";
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
    private readonly transactionRepo: ITransactionRepository,
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
    // 1. Delegate directly to cancelOrder if target status is CANCELLED
    if (newStatus === "CANCELLED") {
      return await this.cancelOrder(orderId, actor);
    }

    // Fetch Order & User in parallel
    const [order, user] = await Promise.all([
      this.orderRepository.findOrderById(orderId),
      this.userRepository.findUserById(actor.id),
    ]);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 2. Ownership / Assignment Access Guard
    if (actor.role === "CUSTOMER" && order.customerId !== actor.id) {
      throw new ApiError(403, "Forbidden: You can only manage your own orders");
    }

    if (actor.role === "AGENT" && order.agentId !== actor.id) {
      throw new ApiError(403, "Forbidden: You are not assigned to this order");
    }

    // Idempotency: Return early if already in target status
    if (order.status === newStatus) {
      return order;
    }

    // 3. State Machine Transition Guard
    if (!canTransition(order.status, newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${order.status}' to '${newStatus}'`,
      );
    }

    // 4. Role Authorization Guard
    if (!isRoleAllowedToSetStatus(actor.role, newStatus)) {
      throw new ApiError(
        403,
        `Forbidden: '${actor.role}' role is not authorized to transition orders to '${newStatus}'`,
      );
    }

    // 5. Execute Update (Atomically)
    return await this.orderRepository.transaction(async (tx: PrismaTx) => {
      return await this.orderRepository.updateOrderStatus(
        order.customerId,
        orderId,
        newStatus,
        tx,
      );
    });
  }
  async cancelOrder(orderId: string, actor: ActorContext): Promise<void> {
    const [order, user] = await Promise.all([
      this.orderRepository.findOrderById(orderId),
      this.userRepository.findUserById(actor.id),
    ]);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Authorization checks
    if (actor.role === "CUSTOMER" && order.customerId !== actor.id) {
      throw new ApiError(403, "Forbidden: You can only cancel your own orders");
    }
    if (actor.role === "AGENT" && order.agentId !== actor.id) {
      throw new ApiError(403, "Forbidden: You are not assigned to this order");
    }

    // Idempotency: If already cancelled, return early without error
    if (order.status === "CANCELLED") {
      return;
    }

    // State Machine Validation
    if (!canTransition(order.status, "CANCELLED")) {
      throw new ApiError(
        400,
        `Invalid status transition from '${order.status}' to 'CANCELLED'`,
      );
    }
    if (!isRoleAllowedToSetStatus(actor.role, "CANCELLED")) {
      throw new ApiError(
        403,
        `Forbidden: '${actor.role}' role is not authorized to cancel orders`,
      );
    }

    // Execute order status and pending transaction cancellation inside an atomic transaction
    await this.orderRepository.transaction(async (tx: PrismaTx) => {
      // 1. Update Order Status
      await this.orderRepository.updateOrderStatus(
        order.customerId,
        orderId,
        "CANCELLED",
        tx,
      );

      // 2. Mark any associated PENDING transaction as FAILED/CANCELLED
      const pendingTx = await this.transactionRepo.findPendingByOrderId(
        orderId,
        tx,
      );
      if (pendingTx) {
        await this.transactionRepo.updateTransactionByReference(
          pendingTx.reference,
          {
            status: "FAILED",
            failureReason: `Order cancelled by ${actor.role.toLowerCase()}`,
          },
          tx,
        );
      }
    });
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
