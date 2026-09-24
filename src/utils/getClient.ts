import { Request } from "express";
import { ApiError } from "./errorHandler.js";

export const ROLE_ALLOWED_CLIENTS = {
  CUSTOMER: ["MOBILE"],
  DRIVER: ["MOBILE"],
  AGENT: ["WEB"],
  ADMIN: ["WEB"],
  SUPER_ADMIN: ["WEB"],
} as const;

export type ClientType = "WEB" | "MOBILE";

export const isClientAllowed = (
  role: keyof typeof ROLE_ALLOWED_CLIENTS,
  client: ClientType,
): boolean => {
  // Cast to a generic ClientType array to allow lookup across varying role-client boundaries safely
  const allowedClients: readonly ClientType[] = ROLE_ALLOWED_CLIENTS[role];

  return allowedClients.includes(client);
};

export const getClientFromRequest = (req: Request): ClientType => {
  const client = req.headers["x-client-type"];
  if (client === "WEB ") {
    return "WEB";
  }
  if (client === "MOBILE") {
    return "MOBILE";
  }
  throw new ApiError(400, "Invalid or missing client type");
};
