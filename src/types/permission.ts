import { Permission } from "./permission.enum.js";

export const PERMISSIONS = {
  USER: {
    CREATE: Permission.USER_CREATE,
    READ: Permission.USER_READ,
    UPDATE: Permission.USER_UPDATE,
    DELETE: Permission.USER_DELETE,
    SUSPEND: Permission.USER_SUSPEND,
  },

  ROLE: {
    CREATE: Permission.ROLE_CREATE,
    READ: Permission.ROLE_READ,
    UPDATE: Permission.ROLE_UPDATE,
    DELETE: Permission.ROLE_DELETE,
    ASSIGN: Permission.ROLE_ASSIGN,
  },

  STATION: {
    CREATE: Permission.STATION_CREATE,
    READ: Permission.STATION_READ,
    UPDATE: Permission.STATION_UPDATE,
    DELETE: Permission.STATION_DELETE,
  },

  ORDER: {
    CREATE: Permission.ORDER_CREATE,
    READ: Permission.ORDER_READ,
    UPDATE: Permission.ORDER_UPDATE,
    CANCEL: Permission.ORDER_CANCEL,
    APPROVE: Permission.ORDER_APPROVE,
  },

  PAYMENT: {
    READ: Permission.PAYMENT_READ,
    VERIFY: Permission.PAYMENT_VERIFY,
    REFUND: Permission.PAYMENT_REFUND,
  },

  DASHBOARD: {
    READ: Permission.DASHBOARD_READ,
  },

  SETTINGS: {
    UPDATE: Permission.SETTINGS_UPDATE,
  },
} as const;

/**
 * Customer/User permissions
 */
export const USER_PERMISSIONS: Permission[] = [
  Permission.ORDER_CREATE,
  Permission.ORDER_READ,
  Permission.ORDER_CANCEL,
  Permission.STATION_READ,
  Permission.PAYMENT_READ,
  Permission.ORDER_UPDATE,
  Permission.TRANSACTION_READ,
];

/**
 * Admin permissions
 */
export const ADMIN_PERMISSIONS: Permission[] = [
  // Dashboard
  Permission.DASHBOARD_READ,

  // Users
  Permission.USER_READ,
  Permission.USER_UPDATE,
  Permission.USER_SUSPEND,

  // Stations
  Permission.STATION_CREATE,
  Permission.STATION_READ,
  Permission.STATION_UPDATE,

  // Orders
  Permission.ORDER_READ,
  Permission.ORDER_UPDATE,
  Permission.ORDER_APPROVE,

  // Payments
  Permission.PAYMENT_READ,
  Permission.PAYMENT_VERIFY,
  Permission.PAYMENT_READ,

  // Transactions
  Permission.TRANSACTION_READ,
];
export const AGENT_PERMISSIONS: Permission[] = [
  Permission.ORDER_APPROVE,
  Permission.ORDER_CANCEL,
  Permission.ORDER_READ,
] as Permission[];

/**
 * Super Admin permissions
 * Has access to every permission defined in Prisma.
 */
export const SUPER_ADMIN_PERMISSIONS: Permission[] = Object.values(
  Permission,
) as Permission[];

/**
 * Permission lookup by role
 */
export const ROLE_PERMISSIONS = {
  USER: USER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  AGENT: AGENT_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
} as const;
