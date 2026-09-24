import { Router } from "express";
import { protect } from "../middleware/protection.js";
import { authorize } from "../middleware/authorization.js";
import badgeController from "../model/badges/badges.controller.js";

const badgeRouter = Router();
badgeRouter.use(protect, authorize(["AGENT", "ADMIN", "SUPER_ADMIN"]));

badgeRouter.get("/agent", badgeController.getAgentBadges);
badgeRouter.get("/stream", badgeController.orderEventController);

export default badgeRouter;
