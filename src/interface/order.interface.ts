import { FuelType, OrderStatus } from "../types/general.js";
import { Station } from "./station.interface.js";
import { userWithoutPassword } from "./user.interface.js";

export interface Order {
  id: string;
  customerId: string;
  stationId: string;
  status: OrderStatus;
  fuelType: FuelType;
  quantity: string;
  fuelSubtotal: string;
  totalAmount: string;
  unitPrice: string;
  assignedAgentId: string;
  completedById: string;
  cancelledById: string;
  deliveryAddress: string;
  VAT: string;
  deliveryFee: string;
  createdAt: string;
  updatedAt: string;
  user?: userWithoutPassword;
  station?: Station;
}
