import { FuelType, OrderStatus } from "../../types/general.js";

export interface OrderDTO {
  userId: string;
  stationId: string;
  status: OrderStatus;
  fuelType: FuelType;
  quantity: number;
  price: number;
  deliveryAddress: string;
}
export interface OrderResponseDTO {
  id: string;
  userId: string;
  stationId: string;
  status: OrderStatus;
  fuelType: FuelType;
  quantity: number;
  price: number;
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
