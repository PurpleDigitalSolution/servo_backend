import express from "express";

// 1. Import your refactored classes
import { AuthRepository } from "../model/Authentication/Auth.repo.js";
import { AuthenticationService } from "../model/Authentication/Auth.service.js";
import { AuthController } from "../model/Authentication/Auth.controller.js";
import { EmailService } from "../service/email.service.js";
import { SessionService } from "../utils/Session.js";

// Import validation schemas and middlewares
import {
  createAgentSchema,
  createUserSchema,
  loginRequestSchema,
  requestOtpSchema,
  resetPasswordSchema,
  sendTestEmailSchema,
  verifyOtpSchema,
  changePasswordSchema,
  changeDefaultPasswordSchema,
  AccountStatusUpdateRequestSchema,
} from "../validation/authentication.validation.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/protection.js";
import {
  authorize,
  authorizePermission,
  requirePasswordChange,
} from "../middleware/authorization.js";

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
// 3. PUBLIC ROUTES
// =========================================================================

// Mobile registration & login
authenticationRouter.post(
  "/mobile/register",
  validate(createUserSchema),
  authController.register,
);

authenticationRouter.post(
  "/mobile/login",
  validate(loginRequestSchema),
  authController.loginMobile,
);

// Admin login
authenticationRouter.post(
  "/admin/login",
  validate(loginRequestSchema),
  authController.loginAdmin,
);

// Password recovery & OTP verification
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
  "/test-email",
  // protect,
  validate(sendTestEmailSchema),
  authController.sendTestEmail,
);

authenticationRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

// Session refresh
authenticationRouter.get("/refresh", authController.refreshSession);

// =========================================================================
// 4. PROTECTED ROUTES (Requires authentication & default password check)
// =========================================================================

// Forced Default Password Change (Bypasses requirePasswordChange check inside middleware)
authenticationRouter.post(
  "/change-default-password",
  protect,
  validate(changeDefaultPasswordSchema),
  authController.changeDefaultPassword,
);

// Normal Password Change (Requires current password)
authenticationRouter.post(
  "/change-password",
  protect,
  requirePasswordChange(),
  validate(changePasswordSchema),
  authController.changePassword,
);

// Authenticated User Info
authenticationRouter.get(
  "/authenticated",
  protect,
  requirePasswordChange(),
  authController.getAuthenticatedUser,
);

// Logout (Mobile & General)
authenticationRouter.post("/logout", protect, authController.logout);
authenticationRouter.post("/refresh", authController.refreshSession);
authenticationRouter.post("/mobile/logout", protect, authController.logout);

// Admin Agent Registration
authenticationRouter.post(
  "/admin/register",
  protect,
  requirePasswordChange(),
  authorize(["SUPER_ADMIN"]),
  authorizePermission(["USER_CREATE"]),
  validate(createAgentSchema),
  authController.registerAgent,
);

authenticationRouter.post(
  "/admin/account-status",
  protect,
  requirePasswordChange(),
  authorize(["SUPER_ADMIN"]),
  authorizePermission(["USER_UPDATE"]),
  validate(AccountStatusUpdateRequestSchema),
  authController.accountStatusUpdate,
);

export default authenticationRouter;
