import {
  createUserSchema,
  loginBodySchema,
  registrationResponseSchema,
  userLoginResponse,
} from "../../validation/authentication.validation.js";
import { errorSchema } from "../../validation/comm.js";
import { registry } from "../../docs/registry.js";

registry.registerPath({
  method: "post",

  path: "/auth/register",

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
