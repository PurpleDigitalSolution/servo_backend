import express from "express";
import { AuthController } from "../model/Authentication/Auth.controller.js";
import {
  createUserSchema,
  loginRequestSchema,
} from "../validation/authentication.validation.js";
import { validate } from "../middleware/validation.js";
import { protect } from "../middleware/protection.js";

const authenticationRouter = express.Router();
// mobile authentication routes
authenticationRouter.post(
  "/mobile/register",
  validate(createUserSchema),
  AuthController.register,
);
authenticationRouter.post(
  "/mobile/login",
  validate(loginRequestSchema),
  AuthController.loginMobile,
);
authenticationRouter.post("/mobile/logout", protect, AuthController.logout);

// admin authentication routes
authenticationRouter.post(
  "/admin/login",
  validate(loginRequestSchema),
  AuthController.loginAdmin,
);
// general authentication routes
authenticationRouter.get(
  "/authenticated",
  protect,
  AuthController.getAuthenticatedUser,
);
authenticationRouter.get("/refresh", AuthController.refreshSession);
authenticationRouter.post("/logout", protect, AuthController.logout);
export default authenticationRouter;
