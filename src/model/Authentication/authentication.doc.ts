import {
  createAgentSchema,
  createUserSchema,
  loginBodySchema,
  registrationResponseSchema,
  sendTestEmailSchema,
  userLoginResponse,
} from "../../validation/authentication.validation.js";
import { errorSchema } from "../../validation/comm.js";
import { registry } from "../../docs/registry.js";
import { z } from "zod";

registry.registerPath({
  method: "post",

  path: "/auth/mobile/register",

  tags: ["Authentication"],

  summary: "Register a new user",

  description: "Creates a new user account.",

  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createUserSchema.shape.body,
        },
      },
    },
  },

  responses: {
    201: {
      description: "User created successfully",

      content: {
        "application/json": {
          schema: z.object({
            statusCode: z.number(),
            data: z.object({
              email: z.string().email(),
              subject: z.string(),
            }),
            message: z.string(),
            success: z.boolean(),
            meta: z.any().optional(),
          }),
        },
      },
    },

    400: {
      description: "Validation Error",

      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",

  path: "/auth/admin/register",

  tags: ["Authentication"],

  summary: "Register a new agent",

  description: "Creates a new agent account.",

  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createAgentSchema.shape.body,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Agent created successfully",

      content: {
        "application/json": {
          schema: registrationResponseSchema,
        },
      },
    },

    400: {
      description: "Validation Error",

      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/auth/admin/login",
  tags: ["Authentication"],
  summary: "Admin login",
  description: "Authenticates an admin user and returns a JWT token.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: loginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: userLoginResponse,
        },
      },
    },
    400: {
      description: "Validation Error",

      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/auth/mobile/login",
  tags: ["Authentication"],
  summary: "Mobile User login",
  description: "Authenticates a user and returns a JWT token.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: loginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: userLoginResponse,
        },
      },
    },
    400: {
      description: "Validation Error",

      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/auth/test-email",
  tags: ["Authentication"],
  summary: "Send a test email",
  description:
    "Sends a test email to verify that the current mail configuration works.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: sendTestEmailSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Test email sent successfully",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});
