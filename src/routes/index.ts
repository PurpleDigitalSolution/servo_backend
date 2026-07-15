import express from "express";
import { healthCheck } from "../health.js";
import authenticationRouter from "./authentication.route.js";
import { sanitizeBodyMiddleware } from "../middleware/validation.js";
import userRoute from "./user.route.js";
import stationRouter from "./station.route.js";
import OrderRouter from "./order.route.js";
import WebHookRouter from "./webhook.route.js";

const router = express.Router();
router.use(sanitizeBodyMiddleware);
router.get("/health", healthCheck);
router.use("/auth", authenticationRouter);
router.use("/users", userRoute);
router.use("/stations", stationRouter);
router.use("/orders", OrderRouter);

router.use("/webhooks", WebHookRouter);
export default router;
