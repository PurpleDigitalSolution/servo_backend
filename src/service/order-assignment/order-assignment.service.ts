import { IAgentRepository } from "../../model/agent/agent.repository.js";
import { IOrderRepository } from "../../model/order/Order.repository.js";
import { PrismaTx } from "../../types/general.js";
import { ApiError } from "../../utils/errorHandler.js";

const MAX_ORDERS_PER_AGENT = 5;

export interface IOrderAssignmentService {
  autoAssignOrder: (orderId: string, tx?: PrismaTx) => Promise<void>;
  assignAgentToOrder: (
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ) => Promise<void>;
}

export class OrderAssignmentService implements IOrderAssignmentService {
  constructor(
    private readonly agentRepository: IAgentRepository,
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * Auto-assigns an order to the least busy available agent at the station.
   * Reuses an existing transaction client if provided, or starts a new one.
   */
  autoAssignOrder = async (orderId: string, tx?: PrismaTx): Promise<void> => {
    const executeAssignment = async (activeTx: PrismaTx): Promise<void> => {
      const order = await this.orderRepository.findOrderById(orderId, activeTx);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      const stationId = order.stationId;
      if (!stationId) {
        throw new ApiError(400, "Order is not assigned to any station");
      }

      const availableAgents =
        await this.agentRepository.getAvailableAgentsWithOrderCount(
          stationId,
          activeTx,
        );
      // Filter agents under threshold and sort by least busy
      const eligibleAgents = availableAgents
        .filter((agent) => agent._count.assignedOrders < MAX_ORDERS_PER_AGENT)
        .sort((a, b) => a._count.assignedOrders - b._count.assignedOrders);

      if (eligibleAgents.length === 0) {
        console.warn(
          `No eligible agents found for station ${stationId} to assign order ${orderId}`,
        );
        return;
      }

      const selectedAgent = eligibleAgents[0];

      // Execute assignment within transaction scope
      await this.orderRepository.assignOrder(
        order.id,
        selectedAgent.id,
        activeTx,
      );

      if (
        !selectedAgent.workStatus ||
        selectedAgent.workStatus === "AVAILABLE"
      ) {
        await this.agentRepository.assignAgentToStation(
          selectedAgent.id,
          stationId,
          activeTx,
        );
      }
      if (selectedAgent._count.assignedOrders + 1 >= MAX_ORDERS_PER_AGENT) {
        await this.agentRepository.updateAgentWorkStatus(
          selectedAgent.id,
          "NOT_AVAILABLE",
          activeTx,
        );
      }
    };

    // Reuse active transaction or create a new transaction boundary
    if (tx) {
      await executeAssignment(tx);
    } else {
      await this.orderRepository.transaction(executeAssignment);
    }
  };

  /**
   * Manually assigns an agent to an order within a transaction scope.
   */
  assignAgentToOrder = async (
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<void> => {
    const executeManualAssignment = async (
      activeTx: PrismaTx,
    ): Promise<void> => {
      const order = await this.orderRepository.findOrderById(orderId, activeTx);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      const agent = await this.agentRepository.findAgentById(agentId, activeTx);
      if (!agent) {
        throw new ApiError(404, "Agent not found");
      }

      await this.orderRepository.assignOrder(order.id, agent.id, activeTx);
    };

    if (tx) {
      await executeManualAssignment(tx);
    } else {
      await this.orderRepository.transaction(executeManualAssignment);
    }
  };
}
