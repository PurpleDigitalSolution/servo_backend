import express from "express";
import { healthCheck } from "../health.js";
import authenticationRouter from "./authentication.route.js";
import { sanitizeBodyMiddleware } from "../middleware/validation.js";
import userRoute from "./user.route.js";

const router = express.Router();
router.use(sanitizeBodyMiddleware);
router.get("/health", healthCheck);
router.use("/auth", authenticationRouter);
router.use("/users", userRoute);
export default router;
