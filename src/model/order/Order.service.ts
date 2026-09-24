import { OrderDTO, OrderResponseDTO } from "../../interface/dto/order.dto.js";
import { IOrderAssignmentService } from "../../service/order-assignment/order-assignment.service.js";
import { OrderStatus, PrismaTx } from "../../types/general.js";
import { ApiError, GatewayError } from "../../utils/errorHandler.js";
import { canChangeOrderStatus, UserRole } from "../../utils/status.js";
import { IAgentRepository } from "../agent/agent.repository.js";
import { IPricingRepository } from "../settings/price.settings/pricing.repository.js";
import { IStationRepository } from "../station/Station.repository.js";
import { ITransactionRepository } from "../Transaction/Transaction.repository.js";
import { TransactionService } from "../Transaction/Transaction.service.js";
import { IOrderRepository } from "./Order.repository.js";

export interface IUserRepository {
  findUserById(userId: string): Promise<any | null>;
}

export interface ActorContext {
  id: string;
  role: UserRole;
  stationId?: string;
}

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly transactionService: TransactionService,
    private readonly stationRepository: IStationRepository,
    private readonly agentRepository: IAgentRepository,
    private readonly orderAssignment: IOrderAssignmentService,
    private readonly priceSettingsRepo: IPricingRepository,
  ) {}

  // async createOrder(orderData: OrderDTO): Promise<OrderResponseDTO> {
  //   const { customerId, stationId, quantity, unitPrice } = orderData;

  //   if (quantity <= 0 || unitPrice <= 0) {
  //     throw new ApiError(
  //       400,
  //       "Quantity and unit price must be positive numbers.",
  //     );
  //   }

  //   // 1. Parallel Dependency Check
  //   const [user, station] = await Promise.all([
  //     this.userRepository.findUserById(customerId),
  //     this.stationRepository.findStationById(stationId),
  //   ]);

  //   if (!user) throw new ApiError(404, "Target customer profile not found.");
  //   if (!station) throw new ApiError(404, "Target filling station not found.");

  //   // 2. Server-Controlled Calculations
  //   const pricingSettings = await this.priceSettingsRepo.getSettings();

  //   const vatRate = if(pricingSettings && pricingSettings.vat.isEnable) pricingSettings.vat.value
  //   const baselineDeliveryFee = 1200;

  //   const fuelSubtotal = quantity * unitPrice;
  //   const calculatedVat = Number((fuelSubtotal * vatRate).toFixed(2));
  //   const totalAmount = Number(
  //     (fuelSubtotal + calculatedVat + baselineDeliveryFee).toFixed(2),
  //   );

  //   // 3. Atomic Execution Block
  //   try {
  //     return await this.prisma.$transaction(async (tx: any) => {
  //       const order = await this.orderRepository.createOrder(
  //         {
  //           ...orderData,
  //           fuelSubtotal,
  //           VAT: calculatedVat,
  //           deliveryFee: baselineDeliveryFee,
  //           totalAmount,
  //         },
  //         tx,
  //       );

  //       const transaction = await this.transactionService.initialize({
  //         orderId: order.id,
  //         amount: totalAmount,
  //         name: user.name,
  //         email: user.email,
  //         provider: orderData.provider || "PAYSTACK",
  //         tx,
  //       });

  //       return {
  //         ...order,
  //         payResponse: {
  //           orderId: order.id,
  //           authorizationUrl: transaction.authorizationUrl,
  //           reference: transaction.reference,
  //         },
  //       };
  //     });
  //   } catch (error: any) {
  //     if (error instanceof ApiError) throw error;
  //     console.log(error);
  //     if (
  //       error.code === "P2003" ||
  //       error.code === "23503" ||
  //       error.message?.includes("foreign key")
  //     ) {
  //       throw new ApiError(
  //         400,
  //         "Order creation aborted: Invalid relational reference keys supplied.",
  //       );
  //     }

  //     throw new ApiError(
  //       500,
  //       `Order processing critical error: ${error.message || error}`,
  //     );
  //   }
  // }
  async createOrder(orderData: OrderDTO): Promise<OrderResponseDTO> {
    const { customerId, stationId, quantity, unitPrice } = orderData;

    if (quantity <= 0 || unitPrice <= 0) {
      throw new ApiError(
        400,
        "Quantity and unit price must be positive numbers.",
      );
    }

    const [user, station] = await Promise.all([
      this.userRepository.findUserById(customerId),
      this.stationRepository.findStationById(stationId),
    ]);

    if (!user) throw new ApiError(404, "Target customer profile not found.");
    if (!station) throw new ApiError(404, "Target filling station not found.");

    const pricingSettings = await this.priceSettingsRepo.getSettings();

    const deliveryFee = pricingSettings?.deliveryFee?.isEnable
      ? Number(pricingSettings.deliveryFee.value)
      : 0;
    const vatRate = pricingSettings?.vat?.isEnable
      ? Number(pricingSettings.vat.value) / 100
      : 0;

    const fuelSubtotal = quantity * unitPrice;
    const calculatedVat = Number((fuelSubtotal * vatRate).toFixed(2));
    const totalAmount = Number(
      (fuelSubtotal + calculatedVat + deliveryFee).toFixed(2),
    );

    // 1. Create the order — a single fast local write, no network calls,
    // so it can never blow a Prisma interactive-transaction timeout.
    let order;
    try {
      order = await this.orderRepository.createOrder({
        ...orderData,
        fuelSubtotal,
        VAT: calculatedVat,
        deliveryFee,
        totalAmount,
      });
    } catch (error: any) {
      console.error(error);
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

    // 2. Initialize payment OUTSIDE any DB transaction. This hits Paystack,
    // which has unpredictable latency (and now retries on 502/503/504 — see
    // PayStackGateWay), so it must never hold a DB connection/lock open.
    try {
      const transaction = await this.transactionService.initialize({
        orderId: order.id,
        amount: totalAmount,
        name: user.name,
        email: user.email,
        provider: orderData.provider || "PAYSTACK",
        // no `tx` — TransactionService writes this as its own standalone insert
      });

      return {
        ...order,
        payResponse: {
          orderId: order.id,
          authorizationUrl: transaction.authorizationUrl,
          reference: transaction.reference,
        },
      };
    } catch (error) {
      // The order was created successfully and sits in PENDING_PAYMENT with
      // no transaction attached. Don't lose it — let the client retry payment
      // via the existing findPendingTransactionByOrderId flow.
      console.error(
        "Payment initialization failed after order creation:",
        error,
      );

      if (error instanceof GatewayError && error.status >= 500) throw error;

      throw new ApiError(
        500,
        `Order ${order.id} was created but payment initialization failed. Please retry payment for this order.`,
        [error],
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
  async listOrders(
    page: number,
    limit: number,
    actor?: ActorContext,
  ): Promise<{ page: number; limit: number; total: number; orders: any[] }> {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const filters: { stationId?: string; agentId?: string } = {};

    if (actor?.role === "AGENT") {
      filters.agentId = actor.id;
      if (actor.stationId) {
        filters.stationId = actor.stationId;
      }
    }

    const [orderCount, orders] = await Promise.all([
      this.orderRepository.countOrders(filters),
      this.orderRepository.getOrders({
        skip,
        take,
        stationId: filters.stationId,
        agentId: filters.agentId,
      }),
    ]);

    return {
      page: pageNum,
      limit: take,
      total: orderCount,
      orders,
    };
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
    // Delegate to cancelOrder if targeting CANCELLED
    if (newStatus === "CANCELLED") {
      return await this.cancelOrder(orderId, actor);
    }

    const [order, user] = await Promise.all([
      this.orderRepository.findOrderById(orderId),
      this.userRepository.findUserById(actor.id),
    ]);

    if (!order) throw new ApiError(404, "Order not found");
    if (!user) throw new ApiError(404, "User not found");

    // 1. Ownership & Access Guard
    if (actor.role === "CUSTOMER" && order.customerId !== actor.id) {
      throw new ApiError(403, "Forbidden: You can only manage your own orders");
    }

    if (actor.role === "AGENT" && order.assignedAgentId !== actor.id) {
      throw new ApiError(403, "Forbidden: You are not assigned to this order");
    }

    // Idempotency check
    if (order.status === newStatus) {
      return order;
    }

    // 2. Unified State Transition & Authorization Guard
    const transitionCheck = canChangeOrderStatus(
      order.status,
      newStatus,
      actor.role,
    );

    if (!transitionCheck.allowed) {
      throw new ApiError(
        400,
        transitionCheck.reason || "Invalid status transition",
      );
    }

    // 3. Execute Update Atomically
    return await this.orderRepository.transaction(async (tx: PrismaTx) => {
      // free agent assigned to the order
      const statusesToFreeAgent: OrderStatus[] = [
        "IN_TRANSIT",
        "COMPLETED",
        "CANCELLED",
      ];
      if (statusesToFreeAgent.includes(newStatus) && order.assignedAgentId) {
        await this.agentRepository.syncAgentWorkStatus(
          order.assignedAgentId,
          tx,
        );
        if (newStatus === "COMPLETED") {
          await this.orderRepository.completeOrderByAgent(
            orderId,
            order.assignedAgentId,
            tx,
          );
        }
      }
      return await this.orderRepository.updateOrderStatusByTransaction(
        orderId,
        newStatus,
        tx,
      );
    });
  }

  async cancelOrder(orderId: string, actor: ActorContext): Promise<any> {
    const [order, user] = await Promise.all([
      this.orderRepository.findOrderById(orderId),
      this.userRepository.findUserById(actor.id),
    ]);

    if (!order) throw new ApiError(404, "Order not found");
    if (!user) throw new ApiError(404, "User not found");

    // Authorization checks
    if (actor.role === "CUSTOMER" && order.customerId !== actor.id) {
      throw new ApiError(403, "Forbidden: You can only cancel your own orders");
    }
    if (actor.role === "AGENT" && order.assignedAgentId !== actor.id) {
      throw new ApiError(403, "Forbidden: You are not assigned to this order");
    }

    // Idempotency: Return existing order if already cancelled
    if (order.status === "CANCELLED") {
      return order;
    }

    // Unified State Transition & Authorization Guard for Cancellation
    const transitionCheck = canChangeOrderStatus(
      order.status,
      "CANCELLED",
      actor.role,
    );

    if (!transitionCheck.allowed) {
      throw new ApiError(
        400,
        transitionCheck.reason || "Order cannot be cancelled",
      );
    }

    // Execute order status and pending transaction cancellation inside an atomic transaction
    return await this.orderRepository.transaction(async (tx: PrismaTx) => {
      const updatedOrder =
        await this.orderRepository.updateOrderStatusByTransaction(
          orderId,
          "CANCELLED",
          tx,
        );

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
      if (
        actor.role === "AGENT" ||
        actor.role === "ADMIN" ||
        actor.role === "SUPER_ADMIN"
      ) {
        await this.orderRepository.cancelOrderByAgent(
          orderId,
          order.assignedAgentId,
          tx,
        );
      } else if (actor.role === "CUSTOMER") {
        await tx.order.update({
          where: { id: orderId, customerId: actor.id },
          data: {
            status: "CANCELLED",
            cancelledById: actor.id,
          },
        });
      }
      return updatedOrder;
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
  async assignOrderToAgent(agentId: string, orderId: string) {
    return await this.orderAssignment.assignAgentToOrder(orderId, agentId);
  }
}
