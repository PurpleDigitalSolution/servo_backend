import express from "express";
import {
  getProfile,
  updateProfile,
  searchUser,
  getUserById,
  getCustomer,
  getAgent,
} from "../model/user/user.controller.js";
import { validate } from "../middleware/validation.js";
import {
  findUserRequestSchema,
  getCustomerRequestSchema,
  searchRequestSchema,
  updateProfileRequestSchema,
} from "../validation/user.validation.js";
import { protect } from "../middleware/protection.js";
import {
  authorize,
  authorizePermission,
  requirePasswordChange,
} from "../middleware/authorization.js";

const userRoute = express.Router();

// 1. Enforce global authentication & forced password reset guards across all user endpoints
userRoute.use(protect, requirePasswordChange());

// ==========================================
// STATIC & SEARCH ROUTES
// ==========================================

// Get customers list (Admin only)
userRoute.get(
  "/",
  validate(getCustomerRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["USER_READ"]),
  getCustomer,
);

// Get agents list (Admin only)
userRoute.get(
  "/agents",
  validate(getCustomerRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["USER_READ"]),
  getAgent,
);

// Search users (Admin only)
userRoute.get(
  "/search",
  validate(searchRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["USER_READ"]),
  searchUser,
);

// ==========================================
// SELF-SERVICE PROFILE ROUTES
// ==========================================

// Get logged-in user profile
userRoute.get(
  "/profile",
  authorize(["ADMIN", "SUPER_ADMIN", "AGENT", "CUSTOMER", "USER"]),
  authorizePermission(["USER_READ"]),
  getProfile,
);

// Update logged-in user profile
userRoute.put(
  "/profile",
  validate(updateProfileRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN", "AGENT", "CUSTOMER", "USER"]),
  authorizePermission(["USER_UPDATE"]),
  updateProfile,
);

// ==========================================
// PARAMETERIZED ROUTES
// ==========================================

// Get user profile by ID (Admin & Super Admin)
userRoute.get(
  "/user-profile/:id",
  validate(findUserRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["USER_READ"]),
  getUserById,
);

export default userRoute;
