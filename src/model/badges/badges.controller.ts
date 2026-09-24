import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async.js";
import { badgeSSEManager } from "./badge.sse.js";
import badgeService, { IBadgeService } from "./badges.service.js";
import { ApiError } from "../../utils/errorHandler.js";
import { SessionPayload } from "../../interface/session.interface.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class BadgeController {
  constructor(private readonly badgeService: IBadgeService) {}

  /**
   * GET /api/v1/badges/stream?agentId=...&stationId=...
   * Connects client to real-time SSE stream & sends initial badge payload
   */
  readonly orderEventController = asyncHandler(
    async (req: Request, res: Response) => {
      const agentId = req.query.agentId as string | undefined;
      const stationId = req.query.stationId as string | undefined;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.flushHeaders();

      // Send initial comment ping to open stream immediately
      res.write(":\n\n");

      badgeSSEManager.addClient(res, agentId, stationId);

      // Push initial badge count on connection if credentials are valid
      if (agentId && stationId) {
        const initialBadges = await this.badgeService.getBadges(
          stationId,
          agentId,
        );
        res.write(
          `data: ${JSON.stringify({ type: "BADGE_UPDATE", data: initialBadges })}\n\n`,
        );
      }
    },
  );

  /**
   * GET /api/v1/badges/agent
   * Retrieves active agent badges via HTTP request
   */
  readonly getAgentBadges = asyncHandler(
    async (req: Request, res: Response) => {
      const { stationId, userId } = req.user as SessionPayload;

      if (!stationId) {
        throw new ApiError(400, "Station ID is required in session payload");
      }

      const result = await this.badgeService.getBadges(stationId, userId);

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Agent badges retrieved successfully"),
        );
    },
  );
}

const badgeController = new BadgeController(badgeService);
export default badgeController;
