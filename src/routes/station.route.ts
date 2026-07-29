import express from "express";
import {
  createStation,
  getStations,
  getStationById,
  updateAvailability,
  getAvailableStations,
} from "../model/station/Station.controller.js";
import { validate } from "../middleware/validation.js";
import { stationRequestSchema } from "../validation/station.validation.js";
import { protect } from "../middleware/protection.js";
import {
  authorize,
  authorizePermission,
  requirePasswordChange,
} from "../middleware/authorization.js";

const stationRouter = express.Router();

// Apply base authentication and password state security guards
stationRouter.use(protect, requirePasswordChange());

// ==========================================
// STATIC / PUBLIC-AUTHENTICATED READ ROUTES
// ==========================================

// Get all stations
stationRouter.get(
  "/",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["STATION_READ"]),
  getStations,
);

// Get available stations (MUST sit above /:id)
stationRouter.get(
  "/available",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["STATION_READ"]),
  getAvailableStations,
);

// ==========================================
// ADMIN MUTATION ROUTES
// ==========================================

// Create a new station
stationRouter.post(
  "/",
  validate(stationRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["STATION_CREATE"]),
  createStation,
);

// Update station availability status
stationRouter.patch(
  "/:id/status",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["STATION_UPDATE"]),
  updateAvailability,
);

// ==========================================
// PARAMETERIZED ROUTES (Always at the bottom)
// ==========================================

// Get station by ID
stationRouter.get(
  "/:id",
  authorize(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]),
  authorizePermission(["STATION_READ"]),
  getStationById,
);

export default stationRouter;
