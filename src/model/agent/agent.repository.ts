import { prisma } from "../../config/database.js";
import { IAgent } from "../../interface/user.interface.js";
import { PrismaTx, UserRole, workStatus } from "../../types/general.js";
const MAX_ORDERS_PER_AGENT = 5;
export type AgentSelectResult = {
  id: string;
  email: string;
  role: UserRole;
  accountStatus: string;
  userProfile: {
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    address: string;
  } | null;
  createdAt: Date;
  stationId?: string | null;
  workStatus?: workStatus | null;
};

export type AgentWithOrderCountResult = {
  id: string;
  workStatus?: workStatus | null;
  _count: {
    assignedOrders: number;
  };
};

export interface IAgentRepository {
  findAgentById(agentId: string, tx?: PrismaTx): Promise<IAgent | null>;
  assignAgentToStation(
    userId: string,
    stationId: string,
    tx?: PrismaTx,
  ): Promise<IAgent>;
  findFreeAgents(tx?: PrismaTx): Promise<AgentSelectResult[]>;
  findAvailableAgents(
    stationId: string,
    tx?: PrismaTx,
  ): Promise<AgentSelectResult[]>;
  getStationAgents(
    stationId: string,
    tx?: PrismaTx,
  ): Promise<AgentSelectResult[]>;
  removeAgentFromStation(
    stationId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<IAgent>;
  getAvailableAgentsWithOrderCount(
    stationId: string,
    tx?: PrismaTx,
  ): Promise<AgentWithOrderCountResult[]>;
  getAgentWithOrderCount(
    agentId: string,
    tx?: PrismaTx,
  ): Promise<AgentWithOrderCountResult | null>;
  updateAgentWorkStatus(
    agentId: string,
    workStatus: workStatus,
    tx?: PrismaTx,
  ): Promise<{ id: string }>;
  syncAgentWorkStatus(
    agentId: string,
    tx?: PrismaTx,
  ): Promise<{ id: string } | null>;
}

export class AgentRepository implements IAgentRepository {
  private readonly defaultSelect = {
    id: true,
    email: true,
    role: true,
    accountStatus: true,
    userProfile: true,
    createdAt: true,
    stationId: true,
    workStatus: true,
  };

  async findAgentById(
    agentId: string,
    tx: PrismaTx = prisma,
  ): Promise<IAgent | null> {
    return tx.user.findFirst({
      where: {
        id: agentId,
        role: "AGENT",
      },
      select: this.defaultSelect,
    });
  }

  async assignAgentToStation(
    userId: string,
    stationId: string,
    tx: PrismaTx = prisma,
  ): Promise<IAgent> {
    return tx.user.update({
      where: {
        id: userId,
        role: "AGENT",
      },
      data: {
        stationId: stationId,
        workStatus: "AVAILABLE",
      },
      select: this.defaultSelect,
    });
  }

  async findFreeAgents(tx: PrismaTx = prisma): Promise<AgentSelectResult[]> {
    return tx.user.findMany({
      where: {
        role: "AGENT",
        stationId: null,
      },
      select: this.defaultSelect,
    });
  }

  async findAvailableAgents(
    stationId: string,
    tx: PrismaTx = prisma,
  ): Promise<AgentSelectResult[]> {
    return tx.user.findMany({
      where: {
        role: "AGENT",
        stationId: stationId,
        workStatus: "AVAILABLE",
      },
      select: this.defaultSelect,
    });
  }

  async getStationAgents(
    stationId: string,
    tx: PrismaTx = prisma,
  ): Promise<AgentSelectResult[]> {
    return tx.user.findMany({
      where: {
        role: "AGENT",
        stationId: stationId,
      },
      select: this.defaultSelect,
    });
  }

  async removeAgentFromStation(
    stationId: string,
    agentId: string,
    tx: PrismaTx = prisma,
  ): Promise<IAgent> {
    return tx.user.update({
      where: {
        id: agentId,
        stationId: stationId,
        role: "AGENT",
      },
      data: {
        stationId: null,
        workStatus: null,
      },
      select: this.defaultSelect,
    });
  }

  async getAvailableAgentsWithOrderCount(
    stationId: string,
    tx: PrismaTx = prisma,
  ): Promise<AgentWithOrderCountResult[]> {
    return tx.user.findMany({
      where: {
        role: "AGENT",
        stationId: stationId,
        workStatus: "AVAILABLE",
      },
      select: {
        id: true,
        workStatus: true,
        _count: {
          select: {
            assignedOrders: {
              where: {
                status: {
                  in: [
                    "PENDING_CONFIRMATION",
                    "PROCESSING",
                    "ASSIGNED",
                    "CONFIRMED",
                    "IN_TRANSIT",
                  ],
                },
              },
            },
          },
        },
      },
    });
  }

  async updateAgentWorkStatus(
    agentId: string,
    workStatus: workStatus,
    tx: PrismaTx = prisma,
  ): Promise<{ id: string }> {
    return tx.user.update({
      where: { id: agentId },
      data: { workStatus },
      select: { id: true },
    });
  }
  async getAgentWithOrderCount(agentId: string, tx: PrismaTx = prisma) {
    return tx.user.findUnique({
      where: {
        id: agentId,
        role: "AGENT",
      },
      select: {
        id: true,
        workStatus: true,
        _count: {
          select: {
            assignedOrders: {
              where: {
                status: {
                  in: [
                    "PENDING_CONFIRMATION",
                    "PROCESSING",
                    "ASSIGNED",
                    "CONFIRMED",
                    "IN_TRANSIT",
                  ],
                },
              },
            },
          },
        },
      },
    });
  }
  async syncAgentWorkStatus(
    agentId: string,
    tx: PrismaTx = prisma,
  ): Promise<{ id: string } | null> {
    const agent = await this.getAgentWithOrderCount(agentId, tx);
    if (!agent) return null;

    const activeOrdersCount = agent._count.assignedOrders;
    // If no active orders, set back to AVAILABLE, otherwise mark NOT_AVAILABLE
    const nextStatus: workStatus =
      activeOrdersCount < MAX_ORDERS_PER_AGENT ? "AVAILABLE" : "NOT_AVAILABLE";

    if (agent.workStatus !== nextStatus) {
      return tx.user.update({
        where: { id: agentId },
        data: { workStatus: nextStatus },
        select: { id: true },
      });
    }

    return { id: agentId };
  }
}
