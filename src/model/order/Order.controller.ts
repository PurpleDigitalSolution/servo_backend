import { Request, Response } from "express";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { asyncHandler } from "../../utils/async.js";
import { ActorContext, OrderService } from "./Order.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { OrderRepository } from "./Order.repository.js";
import { UserRepository } from "../user/user.repository.js";
import { TransactionService } from "../Transaction/Transaction.service.js";
import { TransactionRepository } from "../Transaction/Transaction.repository.js";
import { StationRepository } from "../station/Station.repository.js";
import { paymentService } from "../../service/Payments/payment.service.js";
import { ApiError } from "../../utils/errorHandler.js";
import { UserRole } from "../../types/general.js";
import { AgentRepository } from "../agent/agent.repository.js";
import { OrderAssignmentService } from "../../service/order-assignment/order-assignment.service.js";
import pricingSettingRepository from "../settings/price.settings/pricing.repository.js";

const orderRepository = new OrderRepository();
const userRepository = new UserRepository();
const transactionRepo = new TransactionRepository();

const stationRepo = new StationRepository();
const agentRepository = new AgentRepository();
const transactionService = new TransactionService(
  transactionRepo,
  paymentService,
  orderRepository,
);
const orderAssignment = new OrderAssignmentService(
  agentRepository,
  orderRepository,
);
const orderService = new OrderService(
  orderRepository,
  userRepository,
  transactionRepo,
  transactionService,
  stationRepo,
  agentRepository,
  orderAssignment,
  pricingSettingRepository,
);
export class OrderController {
  private static handleGetOrderPipeline = (clientSource: string) => {
    return asyncHandler(async (req: Request, res: Response) => {
      const userId =
        clientSource === "MOBILE" ? req.user?.userId : req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const orders = await orderService.getUserOrders(
        userId as string,
        page,
        limit,
      );
      res.json(new ApiResponse(200, orders, "Orders retrieved successfully"));
    });
  };
  static handleUpdateOrderPipeline = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.userId;
      const orderId = req.params.orderId;
      const { status } = req.body;

      const updatedOrder = await orderService.updateOrderStatus(
        orderId as string,
        status,
        { id: userId as string, role: req.user?.role as any },
      );
      res.json(
        new ApiResponse(200, updatedOrder, "Order status updated successfully"),
      );
    },
  );
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderData: OrderDTO = req.body;
    const order = await orderService.createOrder(orderData);
    res
      .status(201)
      .json(new ApiResponse(201, order, "Order created successfully"));
  });
  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const order = await orderService.findOrderById(orderId as string);
    if (!order) {
      res.status(404).json(new ApiResponse(404, null, "Order not found"));
      return;
    }
    res.json(new ApiResponse(200, order, "Order retrieved successfully"));
  });
  static listOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!req.user) {
      throw new ApiError(401, "Unauthorized access");
    }

    const actor: ActorContext = {
      id: req.user.userId || req.user.userId,
      role: req.user.role as UserRole,
      stationId: req.user.stationId, // Fixed key from 'station' to 'stationId'
    };

    const result = await orderService.listOrders(page, limit, actor);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Orders listed successfully"));
  });
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const client = req.query.client as string; // "MOBILE" or "ADMIN"

    // Fallback to logged-in user if req.params.userId is omitted in ADMIN routes
    const actorId =
      client === "MOBILE"
        ? req.user?.userId
        : req.params.userId || req.user?.userId;

    const actorRole = req.user?.role;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    if (!actorId) {
      throw new ApiError(400, "Actor User ID could not be identified");
    }

    const updatedOrder = await orderService.cancelOrder(orderId as string, {
      id: actorId as string,
      role: actorRole as any,
    });

    res
      .status(200)
      .json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"));
  });
  static getMobileUserOrders = OrderController.handleGetOrderPipeline("MOBILE");
  static getAdminUserOrders = OrderController.handleGetOrderPipeline("ADMIN");
  static assignOrderToAgent = asyncHandler(
    async (req: Request, res: Response) => {
      const { agentId } = req.body;
      const { orderId } = req.params;
      await orderService.assignOrderToAgent(agentId, orderId as string);
      res.status(200).json(new ApiResponse(200, null, "Order Assigned"));
    },
  );
}
