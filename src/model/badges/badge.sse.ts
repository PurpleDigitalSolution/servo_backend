import { Response } from "express";

interface OrderEvent {
  orderId: string;
  type: "NEW_ORDER" | "ORDER_UPDATED";
  data: unknown;
}

interface SSEClient {
  res: Response;
  agentId?: string;
  stationId?: string;
}
export interface IBadgeSSEManager {
  addClient(res: Response, agentId?: string, stationId?: string): void;
  removeClient(client: SSEClient): void;
  notify(event: OrderEvent): void;
  emitToAgent(
    agentId: string,
    stationId: string,
    badgeStats: any,
    type?: "NEW_ORDER" | "BADGE_UPDATE",
  ): void;
  getClientCount(): number;
}

export class BadgeSSEManager implements IBadgeSSEManager {
  private clients = new Set<SSEClient>();

  addClient(res: Response, agentId?: string, stationId?: string) {
    const client: SSEClient = { res, agentId, stationId };
    this.clients.add(client);

    res.on("close", () => {
      this.removeClient(client);
    });
  }

  removeClient(client: SSEClient) {
    this.clients.delete(client);
  }

  /**
   * Broadcasts a generic order event to ALL connected clients.
   */
  notify(event: OrderEvent) {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      client.res.write(message);
    }
  }

  /**
   * Emits badge updates specifically to an agent at a given station.
   */
  emitToAgent(
    agentId: string,
    stationId: string,
    badgeStats: any,
    type?: "NEW_ORDER" | "BADGE_UPDATE",
  ) {
    const payload = `data: ${JSON.stringify({ type: type || "BADGE_UPDATE", data: badgeStats })}\n\n`;

    for (const client of this.clients) {
      if (client.agentId === agentId && client.stationId === stationId) {
        client.res.write(payload);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const badgeSSEManager = new BadgeSSEManager();

/**
 * GET /api/v1/badges/stream?agentId=...&stationId=...
 */

export const notifyNewOrder = (orderData: OrderEvent) => {
  badgeSSEManager.notify(orderData);
};
