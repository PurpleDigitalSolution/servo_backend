import express from "express";
import { AgentController } from "../model/agent/agent.controller.js";
import { validate } from "../middleware/validation.js";
import {
  assignAgentToStationRequestSchema,
  getAvailableAgentsForStationRequestSchema,
  getStationAgentsRequestSchema,
  removeAgentFromStationRequestSchema,
} from "../validation/agent.validation.js";

import { StationRepository } from "../model/station/Station.repository.js";
import { AgentRepository } from "../model/agent/agent.repository.js";
import { AgentService } from "../model/agent/agent.service.js";
import { protect } from "../middleware/protection.js";
import { authorize } from "../middleware/authorization.js";

const stationRepository = new StationRepository();
const agentRepository = new AgentRepository();
const agentService = new AgentService(stationRepository, agentRepository);

const agentRouter = express.Router();
const agentController = new AgentController(agentService);
agentRouter.use(protect);
agentRouter.get(
  "/station/:stationId/available-agents",
  validate(getAvailableAgentsForStationRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  agentController.getAvailableAgentsForStation,
);
agentRouter.get(
  "/station/:stationId/agents",
  validate(getStationAgentsRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  agentController.getStationAgents,
);
agentRouter.post(
  "/station/:stationId/assign-agent",
  validate(assignAgentToStationRequestSchema),
  authorize(["ADMIN", "SUPER_ADMIN"]),
  agentController.assignAgentToStation,
);
agentRouter.get(
  "/free-agents",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  agentController.getFreeAgents,
);
agentRouter.patch(
  "/station/:stationId/remove-agent/:agentId",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  validate(removeAgentFromStationRequestSchema),
  agentController.removeAgentFromStation,
);
export default agentRouter;
