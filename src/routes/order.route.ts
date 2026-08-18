import express from "express";
import { OrderController } from "../model/order/Order.controller.js";
import { validate } from "../middleware/validation.js";
import {
  assignAgentToOrderRequest,
  createOrderRequest,
  idRequestSchema,
} from "../validation/order.validation.js";
import { protect } from "../middleware/protection.js";
import {
  authorize,
  authorizePermission,
  requirePasswordChange,
} from "../middleware/authorization.js";
import { checkIdempotency } from "../middleware/idempotencyMiddleware.js";

const OrderRouter = express.Router();

// 1. Apply global authentication and password guards to all order routes
OrderRouter.use(protect, requirePasswordChange());

// ==========================================
// STATIC & SPECIFIC ROUTES (Must come BEFORE generic /:id)
// ==========================================

// Create Order (Mobile)
OrderRouter.post(
  "/mobile",
  validate(createOrderRequest),
  authorize(["CUSTOMER"]),
  authorizePermission(["ORDER_CREATE"]),
  checkIdempotency(),
  OrderController.createOrder,
);

// Get logged-in mobile user's orders
OrderRouter.get(
  "/mobile/user",
  authorize(["CUSTOMER"]),
  authorizePermission(["ORDER_READ"]),
  OrderController.getMobileUserOrders,
);

// Get specific mobile order
OrderRouter.get(
  "/mobile/:id",
  validate(idRequestSchema),
  authorize(["CUSTOMER"]),
  authorizePermission(["ORDER_READ"]),
  OrderController.getOrderById,
);

// List all orders (Admin level)
OrderRouter.get(
  "/list",
  authorize(["ADMIN", "SUPER_ADMIN", "AGENT"]),
  authorizePermission(["ORDER_READ"]),
  OrderController.listOrders,
);

// Admin query orders for a specific user ID
OrderRouter.get(
  "/user/:userId",
  authorize(["ADMIN", "SUPER_ADMIN", "AGENT"]),
  authorizePermission(["ORDER_READ"]),
  OrderController.getAdminUserOrders,
);

// ==========================================
// DYNAMIC / PARAMETERIZED ROUTES
// ==========================================

// Update order status pipeline
OrderRouter.put(
  "/:orderId/status",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN", "AGENT"]),
  authorizePermission(["ORDER_UPDATE", "ORDER_APPROVE", "ORDER_CANCEL"]),
  OrderController.handleUpdateOrderPipeline,
);

// Get order by generic ID
OrderRouter.get(
  "/:id",
  validate(idRequestSchema),
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN", "AGENT"]),
  authorizePermission(["ORDER_READ"]),
  OrderController.getOrderById,
);

OrderRouter.put(
  "/:orderId/agent",
  validate(assignAgentToOrderRequest),
  authorize(["ADMIN", "SUPER_ADMIN", "AGENT"]),
  authorizePermission(["ORDER_UPDATE"]),
  OrderController.assignOrderToAgent,
);

export default OrderRouter;
