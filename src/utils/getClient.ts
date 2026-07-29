export const ROLE_ALLOWED_CLIENTS = {
  CUSTOMER: ["MOBILE"],
  DRIVER: ["MOBILE"],
  AGENT: ["ADMIN"],
  ADMIN: ["ADMIN"],
  SUPER_ADMIN: ["ADMIN"],
} as const;

export type ClientType = "ADMIN" | "MOBILE";

export const isClientAllowed = (
  role: keyof typeof ROLE_ALLOWED_CLIENTS,
  client: ClientType,
): boolean => {
  // Cast to a generic ClientType array to allow lookup across varying role-client boundaries safely
  const allowedClients: readonly ClientType[] = ROLE_ALLOWED_CLIENTS[role];

  return allowedClients.includes(client);
};
