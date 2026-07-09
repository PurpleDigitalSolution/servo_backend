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

const stationRouter = express.Router();

stationRouter.post("/", validate(stationRequestSchema), createStation);
stationRouter.get("/", getStations);
stationRouter.get("/available", getAvailableStations);
stationRouter.get("/:id", getStationById);
stationRouter.patch("/:id/status", updateAvailability);

export default stationRouter;
