import { FuelType } from "../types/general.js";

export interface Station {
  id: string;
  name: string;
  addressState: string;
  addressStreet: string;
  addressCity: string;
  addressCountry: string;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  openTime: Date;
  closeTime: Date;
  is24h: boolean;
  fuelTypes: FuelType[];
  prices: Record<FuelType, number>;
  createdAt: Date;
  updatedAt: Date;
}
