import { OrderDTO, OrderResponseDTO } from "../../interface/dto/order.dto.js";
import { OrderStatus } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";
import { TransactionService } from "../Transaction/Transaction.service.js";
import { IOrderRepository } from "./Order.repository.js";

// Basic interface descriptions to ensure structural alignment with injected user repo instance
export interface IUserRepository {
  findUserById(userId: string): Promise<any | null>;
}

export class OrderService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Orchestrates the verification of users, persistence of orders, and down-stream checkout payment linkages.
   */
  async createOrder(orderData: OrderDTO): Promise<OrderResponseDTO> {
    try {
      const user = await this.userRepository.findUserById(orderData.userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const order = await this.orderRepository.createOrder(orderData);

      const transaction = await this.transactionService.initialize(
        order.id,
        Number(order.price),
        user.email,
      );

      const payResponse = {
        orderId: order.id,
        authorizationUrl: transaction.authorizationUrl,
        reference: transaction.reference,
      };
      return { ...order, payResponse };
    } catch (error: any) {
      // Intercept and translate standard relational database engine Foreign Key errors
      if (
        error.code === "23503" ||
        error.message?.includes("foreign key constraint")
      ) {
        throw new ApiError(404, "User not found");
      }
      throw error;
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
    return await this.orderRepository.findOrderById(orderId);
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
    adminId?: string,
  ): Promise<void> {
    try {
      const res = await this.orderRepository.updateOrderStatus(
        userId,
        orderId,
        status,
      );
      if (!res) {
        throw new ApiError(404, "Order not found");
      }
      if (adminId) {
        console.log(
          `Admin ${adminId} updated status to ${status} for order ${orderId}`,
        );
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
