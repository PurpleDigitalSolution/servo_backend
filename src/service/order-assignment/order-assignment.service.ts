import { IAgentRepository } from "../../model/agent/agent.repository.js";
import { badgeSSEManager } from "../../model/badges/badge.sse.js";
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
   */
  autoAssignOrder = async (orderId: string, tx?: PrismaTx): Promise<void> => {
    // Track notification payload outside the transaction scope
    let notificationData: { agentId: string; stationId: string } | null = null;

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

      const eligibleAgents = availableAgents.filter(
        (agent) => agent._count.assignedOrders < MAX_ORDERS_PER_AGENT,
      );

      if (eligibleAgents.length === 0) {
        console.warn(
          `No eligible agents found for station ${stationId} to assign order ${orderId}`,
        );
        return;
      }

      const selectedAgent =
        eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];

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

      // Record parameters for post-commit dispatch
      notificationData = { agentId: selectedAgent.id, stationId };
    };

    // Execute database operations
    if (tx) {
      await executeAssignment(tx);
    } else {
      await this.orderRepository.transaction(executeAssignment);
    }

    // Emit SSE event AFTER transaction completes successfully
    if (notificationData) {
      const { agentId, stationId } = notificationData;
      badgeSSEManager.emitToAgent(
        agentId,
        stationId,
        { item: "order", value: 1 },
        "NEW_ORDER",
      );
    }
    console.log(`SSE event emitted for manual assignment: Agent Station`);
  };

  /**
   * Manually assigns an agent to an order and triggers an SSE update.
   */
  assignAgentToOrder = async (
    orderId: string,
    agentId: string,
    tx?: PrismaTx,
  ): Promise<void> => {
    let notificationData: { agentId: string; stationId: string } | null = null;

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

      if (order.stationId) {
        notificationData = { agentId: agent.id, stationId: order.stationId };
      }
    };

    if (tx) {
      await executeManualAssignment(tx);
    } else {
      await this.orderRepository.transaction(executeManualAssignment);
    }

    // Send SSE event for manual assignments post-commit
    if (notificationData) {
      const { agentId: assignedAgentId, stationId } = notificationData;
      badgeSSEManager.emitToAgent(
        assignedAgentId,
        stationId,
        { item: "order", value: 1 },
        "NEW_ORDER",
      );

      console.log(
        `SSE event emitted for manual assignment: Agent ${assignedAgentId}, Station ${stationId}`,
      );
    }
    console.log("notificationData:", notificationData);
  };
}
