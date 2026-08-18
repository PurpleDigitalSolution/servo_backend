import { registry } from "../../docs/registry.js";
import {
  availableAgentsResponseSchema,
  idSchema,
} from "../../validation/agent.validation.js";
import zod from "zod";
registry.registerPath({
  method: "get",
  path: "/agents/station/{stationId}/available-agents",
  tags: ["Agent Management"],
  summary: "Get available agents for a station",
  request: {
    params: zod.object({
      stationId: idSchema,
    }),
  },
  responses: {
    200: {
      description: "Available agents retrieved successfully",
      content: {
        "application/json": {
          schema: availableAgentsResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/agents/station/{stationId}/assign-agent",
  tags: ["Agent Management"],
  summary: "Assign an agent to a station",
  request: {
    params: zod.object({
      stationId: idSchema,
    }),
  },
  responses: {
    200: {
      description: "Agent assigned to station successfully",
      content: {
        "application/json": {
          schema: zod.any(),
        },
      },
    },
  },
});
