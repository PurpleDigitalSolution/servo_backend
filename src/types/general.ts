import { Prisma } from "../generated/prisma/client.js";
export type UserType = "CUSTOMER" | "ADMIN" | "AGENT" | "DRIVER";
export type UserRole =
  "CUSTOMER" | "DRIVER" | "ADMIN" | "AGENT" | "SUPER_ADMIN";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export type VerificationStatus =
  "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
export type FuelType = "PETROL" | "DIESEL" | "COOKING_GAS";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING_CONFIRMATION"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "ASSIGNED"
  | "ARRIVED"
  | "IN_TRANSIT";
export type PaymentMethod = "PAYSTACK";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PrismaTx = Prisma.TransactionClient;
