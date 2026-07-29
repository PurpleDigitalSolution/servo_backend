import { Permission, UserRole } from "../generated/prisma/enums.js";
export interface SessionPayload {
  sessionId?: string;
  userId: string;
  email?: string;
  role: UserRole;
  permissions?: Permission[];
  client: "MOBILE" | "ADMIN";
  mustChangePassword?: boolean;
}
export interface jwtSignReturnType {
  accessToken: string;
  refreshToken: string;
}
