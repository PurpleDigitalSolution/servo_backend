import { FuelType, OrderStatus, providerType } from "../../types/general.js";

export interface OrderDTO {
  customerId: string;
  unitPrice: number;
  stationId: string;
  status: OrderStatus;
  fuelType: FuelType;
  quantity: number;
  fuelSubtotal: number;
  totalAmount: number;
  VAT: number;
  deliveryFee: number;
  deliveryAddress: string;
  provider: providerType;
}
export interface OrderResponseDTO {
  id: string;
  customerId: string;
  stationId: string;
  status: OrderStatus;
  fuelType: FuelType;
  quantity: number;
  totalPrice: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  station?: {
    id: string;
    name: string;
  };
  payResponse: {
    orderId: string;
    authorizationUrl: string;
    reference: string;
  };
}
