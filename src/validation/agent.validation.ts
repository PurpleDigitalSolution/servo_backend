import { z } from "zod";
export const idSchema = z.string().uuid({ message: "Invalid UUID format" });

export const assignAgentToStationSchema = z.object({
  agentId: idSchema,
  stationId: idSchema,
});

export const getAvailableAgentsForStationSchema = z.object({
  stationId: idSchema,
});

export const getStationAgentsSchema = z.object({
  stationId: idSchema,
});
export const removeAgentFromStationSchema = z.object({
  stationId: idSchema,
  agentId: idSchema,
});
export const removeAgentFromStationRequestSchema = z.object({
  params: removeAgentFromStationSchema,
});
export const assignAgentToStationRequestSchema = z.object({
  body: z.object({
    agentIds: z
      .array(z.string().uuid({ message: "Invalid UUID format" }))
      .min(1, { message: "At least one agent must be assigned" }),
  }),
  params: z.object({
    stationId: idSchema,
  }),
});
export const getAvailableAgentsForStationRequestSchema = z.object({
  params: getAvailableAgentsForStationSchema,
});

export const getStationAgentsRequestSchema = z.object({
  params: getStationAgentsSchema,
});

export const availableAgentsResponseSchema = z.array(
  z.object({
    id: z.string().uuid(),
    fullName: z.string().min(1).max(100),
    email: z.string().email(),
    phoneNumber: z.string().min(1).max(15),
    workStatus: z.enum(["AVAILABLE", "NOT_AVAILABLE"]).nullable(),
  }),
);
