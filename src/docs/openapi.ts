import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";
import "../model/Authentication/authentication.doc.js";
import "../model/user/user.doc.js";
import "../model/station/station.doc.js";
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.3",

  info: {
    title: "Servo API",
    version: "1.0.0",
    description: "School Management System REST API",
  },

  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local Development",
    },
  ],

  tags: [
    {
      name: "Authentication",
      description: "Authentication endpoints",
    },
    {
      name: "User Management",
      description: "Endpoints for managing user accounts and profiles",
    },
    {
      name: "Station Management",
      description: "Endpoints for managing gas stations",
    },
  ],
});
