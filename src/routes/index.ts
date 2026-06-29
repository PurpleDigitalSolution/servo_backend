import express from "express";
import { healthCheck } from "../health.js";
import authenticationRouter from "./authentication.route.js";

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authenticationRouter);

export default router;
