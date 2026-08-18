export type OrderStatus =
  | "PAYMENT_FAILED"
  | "PENDING_PAYMENT"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

export type UserRole =
  "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | "DRIVER";

// Define allowed NEXT states AND who is authorized to make that transition
export const ORDER_TRANSITION_MATRIX: Record<
  OrderStatus,
  Partial<Record<OrderStatus, readonly UserRole[]>>
> = {
  PAYMENT_FAILED: {
    PENDING_PAYMENT: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
    CANCELLED: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
  },
  PENDING_PAYMENT: {
    PENDING_CONFIRMATION: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
    CANCELLED: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
  },
  PENDING_CONFIRMATION: {
    PROCESSING: ["AGENT", "ADMIN", "SUPER_ADMIN"],
    CANCELLED: ["CUSTOMER", "AGENT", "ADMIN", "SUPER_ADMIN"], // Customer can still cancel here
  },
  PROCESSING: {
    ASSIGNED: ["AGENT", "ADMIN", "SUPER_ADMIN"],
    IN_TRANSIT: ["AGENT", "ADMIN", "SUPER_ADMIN"], // Bypasses assignment when drivers are unavailable
    CANCELLED: ["AGENT", "ADMIN", "SUPER_ADMIN"], // Customer can NO LONGER self-cancel past here
  },
  ASSIGNED: {
    IN_TRANSIT: ["AGENT", "DRIVER", "ADMIN", "SUPER_ADMIN"],
    PROCESSING: ["AGENT", "ADMIN", "SUPER_ADMIN"], // Re-queue / Unassign
    CANCELLED: ["AGENT", "ADMIN", "SUPER_ADMIN"],
  },
  IN_TRANSIT: {
    ARRIVED: ["AGENT", "DRIVER", "ADMIN", "SUPER_ADMIN"],
    COMPLETED: ["AGENT", "DRIVER", "ADMIN", "SUPER_ADMIN"], // REMOVE WHEN DRIVERS ARE IMPLEMENTED
    CANCELLED: ["ADMIN", "SUPER_ADMIN"], // Only admins can cancel while in transit
  },
  ARRIVED: {
    COMPLETED: ["AGENT", "DRIVER", "ADMIN", "SUPER_ADMIN"],
    CANCELLED: ["ADMIN", "SUPER_ADMIN"],
  },
  COMPLETED: {},
  CANCELLED: {},
} as const;

/**
 * Single, unified check for state transition AND role authorization.
 */
export function canChangeOrderStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  role: UserRole,
): { allowed: boolean; reason?: string } {
  // 1. Check if the transition itself is valid
  const allowedTransitions = ORDER_TRANSITION_MATRIX[currentStatus];
  const authorizedRoles = allowedTransitions[targetStatus];

  if (!authorizedRoles) {
    return {
      allowed: false,
      reason: `Cannot transition order status from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  // 2. Check if the role is authorized for this specific transition
  if (!authorizedRoles.includes(role)) {
    return {
      allowed: false,
      reason: `Role '${role}' is not authorized to transition order from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}
