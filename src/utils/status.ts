export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

export type UserRole = "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";

export const ALLOWED_ORDER_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING_PAYMENT: ["PENDING_CONFIRMATION", "CANCELLED"],
  PENDING_CONFIRMATION: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["ASSIGNED", "CANCELLED", "COMPLETED", "IN_TRANSIT"], // remove completed, in_transit when drivers are available
  ASSIGNED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
} as const;

export const ROLE_ALLOWED_STATUSES: Record<UserRole, readonly OrderStatus[]> = {
  CUSTOMER: ["CANCELLED"],
  AGENT: ["IN_TRANSIT", "ARRIVED", "COMPLETED"],
  ADMIN: [
    "PENDING_PAYMENT",
    "PENDING_CONFIRMATION",
    "PROCESSING",
    "ASSIGNED",
    "IN_TRANSIT",
    "ARRIVED",
    "COMPLETED",
    "CANCELLED",
  ],
  SUPER_ADMIN: [
    "PENDING_PAYMENT",
    "PENDING_CONFIRMATION",
    "PROCESSING",
    "ASSIGNED",
    "IN_TRANSIT",
    "ARRIVED",
    "COMPLETED",
    "CANCELLED",
  ],
} as const;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function isRoleAllowedToSetStatus(
  role: UserRole,
  targetStatus: OrderStatus,
): boolean {
  const allowed = ROLE_ALLOWED_STATUSES[role];
  return allowed ? allowed.includes(targetStatus) : false;
}
