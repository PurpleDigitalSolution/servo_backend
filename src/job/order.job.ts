// cron/assignPendingOrders.cron.ts
import cron from "node-cron";
import { AgentRepository } from "../model/agent/agent.repository.js";
import { OrderRepository } from "../model/order/Order.repository.js";
import { OrderAssignmentService } from "../service/order-assignment/order-assignment.service.js";
import { PrismaTx } from "../types/general.js";
import { withAdvisoryLock } from "../utils/advisoryLock.js";

const orderRepo = new OrderRepository();
const agentRepo = new AgentRepository();
const orderAssignment = new OrderAssignmentService(agentRepo, orderRepo);

// A unique key identifying this specific background task across all app nodes
const LOCK_KEY = "cron:assign_pending_orders";

const findAndAssignOrders = async (): Promise<void> => {
  const { executed } = await withAdvisoryLock(
    LOCK_KEY,
    async (tx: PrismaTx) => {
      const orders = await orderRepo.getUnassignedOrders(tx);

      if (!orders || orders.length === 0) {
        return;
      }

      console.log(`[Cron] Processing ${orders.length} unassigned order(s)...`);

      for (const order of orders) {
        try {
          await orderAssignment.autoAssignOrder(order.id, tx);
        } catch (error) {
          console.error(
            `[Cron] Failed to assign order ${order.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    },
  );

  if (!executed) {
    console.log(
      "[Cron] Job skipped: Another app instance is currently executing it.",
    );
  }
};

// cron/assignPendingOrders.cron.ts
let isRunning = false;

export const assignPendingOrder = () => {
  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log(
        "[Cron] Previous run still in progress on this instance, skipping tick",
      );
      return;
    }
    isRunning = true;
    try {
      await findAndAssignOrders();
    } finally {
      isRunning = false;
    }
  });
};
