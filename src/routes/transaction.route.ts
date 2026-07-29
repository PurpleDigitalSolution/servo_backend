import express from "express";
import {
  getOrderPendingTransaction,
  getOrderTransaction,
  verifyTransaction,
} from "../model/Transaction/Transaction.controller.js";
import { protect } from "../middleware/protection.js";
import {
  authorize,
  authorizePermission,
  requirePasswordChange,
} from "../middleware/authorization.js";

const transactionRouter = express.Router();

// 1. Apply baseline authentication & forced password change guards
transactionRouter.use(protect, requirePasswordChange());

// ==========================================
// TRANSACTION ROUTES
// ==========================================

/**
 * Verify a transaction using either ?reference=... OR ?orderId=...
 * Accessible by Customers, Admins, and Super Admins
 */
transactionRouter.get(
  "/verify",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["TRANSACTION_READ"]),
  verifyTransaction,
);

/**
 * Fetch all transaction history tied to a specific order ID
 */
transactionRouter.get(
  "/orders/:orderId/all",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  getOrderTransaction,
);

transactionRouter.get(
  "/orders/:orderId",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  getOrderPendingTransaction,
);

export default transactionRouter;
