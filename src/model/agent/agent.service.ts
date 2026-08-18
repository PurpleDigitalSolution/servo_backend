import { IAgent } from "../../interface/user.interface.js";
import { ApiError } from "../../utils/errorHandler.js";
import { IStationRepository } from "../station/Station.repository.js";
import { IAgentRepository, AgentSelectResult } from "./agent.repository.js";

export interface AgentResponseDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  workStatus: string | null;
}

export interface StationWithAgentsDTO {
  station: {
    id: string;
    name: string;
    addressStreet: string;
    addressCity: string;
  };
  agents: AgentResponseDTO[];
}

interface IAgentService {
  assignAgentToStation: (
    agentIds: string[],
    stationId: string,
  ) => Promise<void>;

  getAvailableAgentsForStation: (
    stationId: string,
  ) => Promise<AgentResponseDTO[]>;

  getStationAgents: (stationId: string) => Promise<StationWithAgentsDTO>;
  getFreeAgents: () => Promise<AgentResponseDTO[]>;
}

export class AgentService implements IAgentService {
  constructor(
    private readonly stationRepository: IStationRepository,
    private readonly agentRepository: IAgentRepository,
  ) {}

  /**
   * Bulk assign multiple agents to a single station
   */
  async assignAgentToStation(
    agentIds: string[],
    stationId: string,
  ): Promise<void> {
    if (!agentIds || agentIds.length === 0) {
      throw new ApiError(400, "At least one agent ID must be provided");
    }

    const stationExist =
      await this.stationRepository.findStationById(stationId);
    if (!stationExist) {
      throw new ApiError(404, "Station not found");
    }

    // Fetch agents in parallel to prevent N+1 queries
    const agents = await Promise.all(
      agentIds.map((id) => this.agentRepository.findAgentById(id)),
    );

    // Validate existence and assignments
    agents.forEach((agent, index) => {
      const agentId = agentIds[index];
      if (!agent) {
        throw new ApiError(404, `Agent with ID ${agentId} not found`);
      }

      if (agent.stationId === stationId) {
        throw new ApiError(
          400,
          `Agent ${agent.id} is already assigned to this station`,
        );
      }
    });

    // Execute bulk assignment
    await Promise.all(
      agentIds.map((agentId) =>
        this.agentRepository.assignAgentToStation(agentId, stationId),
      ),
    );
  }

  /**
   * Get formatted list of available agents for a station
   */
  async getAvailableAgentsForStation(
    stationId: string,
  ): Promise<AgentResponseDTO[]> {
    const station = await this.stationRepository.findStationById(stationId);
    if (!station) {
      throw new ApiError(404, "Station not found");
    }

    const availableAgents =
      await this.agentRepository.findAvailableAgents(stationId);

    return availableAgents.map((agent) => this.formatAgentResponse(agent));
  }

  /**
   * Get all unassigned agents (agents with stationId = null)
   */
  async getFreeAgents(): Promise<AgentResponseDTO[]> {
    const freeAgents = await this.agentRepository.findFreeAgents();
    return freeAgents.map((agent) => this.formatAgentResponse(agent));
  }

  /**
   * Get station metadata along with all assigned agents
   */
  async getStationAgents(stationId: string): Promise<StationWithAgentsDTO> {
    const station = await this.stationRepository.findStationById(stationId);
    if (!station) {
      throw new ApiError(404, "Station not found");
    }

    const stationAgents =
      await this.agentRepository.getStationAgents(stationId);

    return {
      station: {
        id: station.id,
        name: station.name,
        addressStreet: station.addressStreet,
        addressCity: station.addressCity,
      },
      agents: stationAgents.map((agent) => this.formatAgentResponse(agent)),
    };
  }

  async removeAgentFromStation(
    stationId: string,
    agentId: string,
  ): Promise<IAgent> {
    const station = await this.stationRepository.findStationById(stationId);
    if (!station) {
      throw new ApiError(404, "Station not found");
    }
    const agent = await this.agentRepository.findAgentById(agentId);
    if (!agent) {
      throw new ApiError(404, "Agent not found");
    }
    if (agent.stationId !== stationId) {
      throw new ApiError(
        400,
        `Agent ${agent.id} is not assigned to station ${stationId}`,
      );
    }
    return await this.agentRepository.removeAgentFromStation(
      stationId,
      agentId,
    );
  }

  private formatAgentResponse(agent: AgentSelectResult): AgentResponseDTO {
    const profile = agent.userProfile;

    return {
      id: agent.id,
      fullName: profile ? `${profile.firstName} ${profile.lastName}` : "N/A",
      email: agent.email,
      phoneNumber: profile?.phoneNumber || "N/A",
      workStatus: agent.workStatus ?? null,
    };
  }
}
