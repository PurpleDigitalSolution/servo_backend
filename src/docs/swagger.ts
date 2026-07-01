import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

export const swaggerMiddleware = [
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
  }),
];
