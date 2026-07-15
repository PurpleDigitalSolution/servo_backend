import express from "express";
import { OrderController } from "../model/order/Order.controller.js";
import { validate } from "../middleware/validation.js";
import {
  createOrderRequest,
  idRequestSchema,
} from "../validation/order.validation.js";
import { protect } from "../middleware/protection.js";
const OrderRouter = express.Router();

OrderRouter.post(
  "/mobile",
  // protect,
  validate(createOrderRequest),
  OrderController.createOrder,
);
OrderRouter.get("/list", protect, OrderController.listOrders);
OrderRouter.get(
  "/:id",
  protect,
  validate(idRequestSchema),
  OrderController.getOrderById,
);
OrderRouter.get("/user/:userId", protect, OrderController.getAdminUserOrders);
OrderRouter.get("/mobile/user", protect, OrderController.getMobileUserOrders);
OrderRouter.get(
  "/mobile/:id",
  protect,
  validate(idRequestSchema),
  OrderController.getOrderById,
);
export default OrderRouter;
