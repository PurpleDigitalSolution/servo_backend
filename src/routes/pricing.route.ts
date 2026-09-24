import { Router } from "express";
import { protect } from "../middleware/protection.js";
import { authorize } from "../middleware/authorization.js";
import pricingController from "../model/settings/price.settings/pricing.controller.js";

export const pricingRoute = Router();
pricingRoute.use(protect, authorize(["ADMIN", "SUPER_ADMIN", "CUSTOMER"]));
pricingRoute.get("/settings/users", pricingController.getSettingsForUser);

pricingRoute.use(protect, authorize(["ADMIN", "SUPER_ADMIN"]));
pricingRoute.get("/settings", pricingController.getSettings);
pricingRoute.put("/settings", pricingController.updateSettings);
