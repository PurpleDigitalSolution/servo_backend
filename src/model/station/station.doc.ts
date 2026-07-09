import { registry } from "../../docs/registry.js";
import {
  getStationSchema,
  stationSchema,
  SstationResponseSchema,
} from "../../validation/station.validation.js";
import { z } from "zod";
registry.registerPath({
  method: "post",
  path: "/stations",
  tags: ["Station Management"],
  summary: "Create a new station",
  description: "Creates a new gas station with the provided details",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: stationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Station created successfully",
      content: {
        "application/json": {
          schema: stationSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/stations",
  tags: ["Station Management"],
  summary: "Get all stations",
  request: {
    query: getStationSchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved stations",
      content: {
        "application/json": {
          schema: z.object({
            pagination: z.object({
              currentPage: z.number(),
              totalPages: z.number(),
              totalStations: z.number(),
            }),
            stations: z.array(SstationResponseSchema),
          }),
        },
      },
    },
    401: {
      description:
        "Unauthorized: Active authentication session cookie is missing or invalid.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Unauthorized: Missing authentication credentials",
            }),
          }),
        },
      },
    },
    404: {
      description:
        "Not Found: No user profile matches the provided identifier.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "User with the specified ID could not be found",
            }),
          }),
        },
      },
    },
  },
});
