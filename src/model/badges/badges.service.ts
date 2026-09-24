import orderRepository, {
  IOrderRepository,
} from "../order/Order.repository.js";
import { badgeSSEManager } from "./badge.sse.js"; // Import your SSE manager

export interface Badge {
  item: string;
  value: number;
}

export interface BadgeCountDTO {
  badges: Badge[];
}

export interface IBadgeService {
  getBadges(stationId: string, agentId: string): Promise<BadgeCountDTO>;
  notifyBadgeUpdate(stationId: string, agentId: string): Promise<void>;
}

export class BadgeService implements IBadgeService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  /**
   * Fetches current badge stats for a station/agent matching BadgeCountDTO shape.
   */
  async getBadges(stationId: string, agentId: string): Promise<BadgeCountDTO> {
    const pendingOrders = await this.orderRepository.pendingOrder(
      stationId,
      agentId,
    );
    const pendingCount = Array.isArray(pendingOrders)
      ? pendingOrders.length
      : Number(pendingOrders || 0);

    return {
      badges: [
        {
          item: "pendingOrders",
          value: pendingCount,
        },
      ],
    };
  }

  /**
   * Dispatches SSE payload to client connection stream.
   */
  async notifyBadgeUpdate(stationId: string, agentId: string): Promise<void> {
    const badgeStats = await this.getBadges(stationId, agentId);
    badgeSSEManager.emitToAgent(agentId, stationId, badgeStats);
  }
}
const badgeService = new BadgeService(orderRepository);
export default badgeService;
