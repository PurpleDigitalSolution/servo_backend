import { Request, Response } from "express";
import { OrderDTO } from "../../interface/dto/order.dto.js";
import { asyncHandler } from "../../utils/async.js";
import { OrderService } from "./Order.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { OrderRepository } from "./Order.repository.js";
import { UserRepository } from "../user/user.repository.js";
import { TransactionService } from "../Transaction/Transaction.service.js";
import { TransactionRepo } from "../Transaction/Transaction.repository.js";
import { prisma } from "../../config/database.js";
import { StationRepository } from "../station/Station.repository.js";
import { paymentService } from "../../service/Payments/payment.service.js";

const orderRepository = new OrderRepository();
const userRepository = new UserRepository();
const transactionRepo = new TransactionRepo();

const stationRepo = new StationRepository();

const transactionService = new TransactionService(
  transactionRepo,
  paymentService,
  orderRepository,
);

const orderService = new OrderService(
  orderRepository,
  userRepository,
  transactionService,
  stationRepo,
  prisma,
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
    const orders = await orderService.listOrders(page, limit);

    res.json(new ApiResponse(200, orders, "Orders listed successfully"));
  });

  static getMobileUserOrders = OrderController.handleGetOrderPipeline("MOBILE");
  static getAdminUserOrders = OrderController.handleGetOrderPipeline("ADMIN");
}
