import { Permission, UserRole } from "../generated/prisma/enums.js";
import { ClientType } from "../utils/getClient.js";
export interface SessionPayload {
  sessionId?: string;
  userId: string;
  email?: string;
  role: UserRole;
  permissions?: Permission[];
  client: ClientType;
  mustChangePassword?: boolean;
  stationId?: string;
  accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
}
export interface jwtSignReturnType {
  accessToken: string;
  refreshToken: string;
}
