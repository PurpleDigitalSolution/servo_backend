import { registry } from "../../docs/registry.js";
import {
  getUsersSchema,
  searchResponseSchema,
  searchUserSchema,
  updateProfileBodySchema,
  updateProfileResponseSchema,
  userIdParamSchema,
} from "../../validation/user.validation.js";

import { z } from "zod";

registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User Management"],
  summary: "Get a list of users",
  description:
    "Retrieves a paginated collection of users registered on the platform.",
  request: {
    query: getUsersSchema,
  },
  responses: {
    200: {
      description: "Successfully fetched user metrics array",
      content: {
        "application/json": {
          schema: z.object({
            users: z.array(updateProfileResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/users/profile",
  tags: ["User Management"],
  summary: "Update user profile metrics",
  description:
    "Updates the authenticated user's account configuration information.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateProfileBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Profile modified successfully information returned.",
      content: {
        "application/json": {
          schema: updateProfileResponseSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/users/profile",
  tags: ["User Management"],
  summary: "Get user profile",
  description: "Retrieves the authenticated user's profile information.",

  responses: {
    200: {
      description: "Profile modified successfully information returned.",
      content: {
        "application/json": {
          schema: updateProfileResponseSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/users/user-profile",
  tags: ["User Management"],
  summary: "Get a user profile",
  description:
    "Retrieves the public and administrative profile information for a specific user identity.",

  request: {
    query: userIdParamSchema,
  },

  responses: {
    200: {
      description: "User profile information successfully retrieved.",
      content: {
        "application/json": {
          schema: updateProfileResponseSchema,
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
registry.registerPath({
  method: "get",
  path: "/users/search",
  tags: ["User Management"],
  summary: "Search for users",
  description: "Searches for users based on the provided query parameters.",
  request: {
    query: searchUserSchema,
  },
  responses: {
    200: {
      description: "Successfully fetched user metrics array",
      content: {
        "application/json": {
          schema: searchResponseSchema,
        },
      },
    },
  },
});
