import { StationDTO } from "../../interface/dto/station.dto.js";
import { prisma } from "../../config/database.js";

export interface IStationRepository {
  createStation(stationData: StationDTO): Promise<any>;
  getStations(skip: number, take: number): Promise<any[]>;
  count(whereClause?: Record<string, any>): Promise<number>;
  findStationByNameAndAddress(stationData: {
    name: string;
    addressStreet: string;
    addressCity: string;
  }): Promise<any | null>;
  findStationById(stationId: string): Promise<any | null>;
  getAvailableStations(params: { skip: number; take: number }): Promise<any[]>;
  search(query: string, params: { skip: number; take: number }): Promise<any[]>;
  updateAvailability(stationId: string, isAvailable: boolean): Promise<any>;
  updateStation(
    stationId: string,
    stationData: Partial<StationDTO>,
  ): Promise<any>;
  deleteStation(stationId: string): Promise<any>;
}

export class StationRepository implements IStationRepository {
  private readonly prismaClient = prisma;

  async createStation(stationData: StationDTO): Promise<any> {
    return await this.prismaClient.station.create({
      data: {
        name: stationData.name,
        addressState: stationData.addressState,
        addressStreet: stationData.addressStreet,
        addressCity: stationData.addressCity,
        addressCountry: stationData.addressCountry || "Nigeria",
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        openTime: stationData.openTime
          ? new Date(`1970-01-01T${stationData.openTime}Z`)
          : null,
        closeTime: stationData.closeTime
          ? new Date(`1970-01-01T${stationData.closeTime}Z`)
          : null,
        is24h: stationData.is24h || false,
        fuelTypes: stationData.fuelTypes,
        prices: stationData.prices,
      },
    });
  }

  async getStations(skip: number, take: number): Promise<any[]> {
    return await this.prismaClient.station.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        addressState: true,
        addressCity: true,
        fuelTypes: true,
        isAvailable: true,
        prices: true,
        is24h: true,
        createdAt: true,
      },
    });
  }

  async count(whereClause: Record<string, any> = {}): Promise<number> {
    return await this.prismaClient.station.count({ where: whereClause });
  }

  async findStationByNameAndAddress(stationData: {
    name: string;
    addressStreet: string;
    addressCity: string;
  }): Promise<any | null> {
    return await this.prismaClient.station.findUnique({
      where: {
        name_addressStreet_addressCity: {
          name: stationData.name,
          addressStreet: stationData.addressStreet,
          addressCity: stationData.addressCity,
        },
      },
    });
  }

  async findStationById(stationId: string): Promise<any | null> {
    return await this.prismaClient.station.findUnique({
      where: { id: stationId },
    });
  }

  async getAvailableStations({ skip = 0, take = 10 } = {}): Promise<any[]> {
    return await this.prismaClient.station.findMany({
      skip,
      take,
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        addressState: true,
        addressCity: true,
        fuelTypes: true,
        prices: true,
      },
    });
  }

  async search(query: string, { skip = 0, take = 10 } = {}): Promise<any[]> {
    return await this.prismaClient.station.findMany({
      skip,
      take,
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { addressState: { contains: query, mode: "insensitive" } },
          { addressStreet: { contains: query, mode: "insensitive" } },
          { addressCity: { contains: query, mode: "insensitive" } },
          { addressCountry: { contains: query, mode: "insensitive" } },
        ],
      },
    });
  }

  async updateAvailability(
    stationId: string,
    isAvailable: boolean,
  ): Promise<any> {
    return await this.prismaClient.station.update({
      where: { id: stationId },
      data: { isAvailable, updatedAt: new Date() },
    });
  }

  async updateStation(
    stationId: string,
    stationData: Partial<StationDTO>,
  ): Promise<any> {
    return await this.prismaClient.station.update({
      where: { id: stationId },
      data: {
        ...stationData,
        openTime: stationData.openTime
          ? new Date(`1970-01-01T${stationData.openTime}Z`)
          : undefined,
        closeTime: stationData.closeTime
          ? new Date(`1970-01-01T${stationData.closeTime}Z`)
          : undefined,
      },
    });
  }

  async deleteStation(stationId: string): Promise<any> {
    return await this.prismaClient.station.delete({
      where: { id: stationId },
    });
  }
}
