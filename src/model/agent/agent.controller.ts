import { Request, Response } from "express";
import { AgentService } from "./agent.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  assignAgentToStation = async (req: Request, res: Response): Promise<void> => {
    const { stationId } = req.params;
    const { agentIds } = req.body;

    await this.agentService.assignAgentToStation(
      agentIds as string[],
      stationId as string,
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Agents assigned to station successfully"),
      );
  };

  getAvailableAgentsForStation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { stationId } = req.params;

    const availableAgents =
      await this.agentService.getAvailableAgentsForStation(stationId as string);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          availableAgents,
          "Available agents retrieved successfully",
        ),
      );
  };

  getFreeAgents = async (_req: Request, res: Response): Promise<void> => {
    const freeAgents = await this.agentService.getFreeAgents();

    res
      .status(200)
      .json(
        new ApiResponse(200, freeAgents, "Free agents retrieved successfully"),
      );
  };
  getStationAgents = async (req: Request, res: Response): Promise<void> => {
    const { stationId } = req.params;
    const stationAgents = await this.agentService.getStationAgents(
      stationId as string,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          stationAgents,
          "Station agents retrieved successfully",
        ),
      );
  };
  removeAgentFromStation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { stationId, agentId } = req.params;

    const updatedAgent = await this.agentService.removeAgentFromStation(
      stationId as string,
      agentId as string,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedAgent,
          "Agent removed from station successfully",
        ),
      );
  };
}
