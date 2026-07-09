import { FuelType } from "../../types/general.js";

export interface StationDTO {
  name: string;
  addressState: string;
  addressStreet: string;
  addressCity: string;
  addressCountry?: string;
  latitude: number;
  longitude: number;
  openTime?: string;
  closeTime?: string;
  is24h?: boolean;
  fuelTypes: FuelType[];
  prices: Record<FuelType, number>;
}
