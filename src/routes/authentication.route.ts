import express from "express";

// 1. Import your newly refactored classes
import { AuthRepository } from "../model/Authentication/Auth.repo.js";
import { AuthenticationService } from "../model/Authentication/Auth.service.js";
import { AuthController } from "../model/Authentication/Auth.controller.js";
import { EmailService } from "../service/email.service.js";
import { SessionService } from "../utils/Session.js";

// Import validation schemas and middlewares
import {
  createUserSchema,
  loginRequestSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../validation/authentication.validation.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/protection.js";

const authenticationRouter = express.Router();

// =========================================================================
// 2. DEPENDENCY INJECTION & INSTANTIATION
// =========================================================================
const authRepository = new AuthRepository();
const emailService = new EmailService();

// Inject repositories and email services into the AuthenticationService
const authService = new AuthenticationService(
  authRepository,
  emailService,
  SessionService,
);

// Inject the AuthenticationService into your AuthController
const authController = new AuthController(authService);

// =========================================================================
// 3. ROUTE REGISTRATIONS (Using the instantiated controller)
// =========================================================================

// Mobile authentication routes
authenticationRouter.post(
  "/mobile/register",
  validate(createUserSchema),
  authController.register, // Uses the instantiated controller
);

authenticationRouter.post(
  "/mobile/login",
  validate(loginRequestSchema),
  authController.loginMobile,
);

authenticationRouter.post("/mobile/logout", protect, authController.logout);

// Admin authentication routes
authenticationRouter.post(
  "/admin/login",
  validate(loginRequestSchema),
  authController.loginAdmin,
);

// General authentication routes
authenticationRouter.get(
  "/authenticated",
  protect,
  authController.getAuthenticatedUser,
);

authenticationRouter.post(
  "/request-password-reset",
  validate(requestOtpSchema),
  authController.forgetPassword,
);

authenticationRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authenticationRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

authenticationRouter.get("/refresh", authController.refreshSession);

authenticationRouter.post("/logout", protect, authController.logout);

export default authenticationRouter;
