import { StationDTO } from "../../interface/dto/station.dto.js";
import { prisma } from "../../config/database.js";

export class StationRepository {
  static async createStation(stationData: StationDTO) {
    return await prisma.station.create({
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
  static async getStations(skip: number, take: number) {
    return prisma.station.findMany({
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
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
  static async count() {
    return await prisma.station.count();
  }
  static async findStationByNameAndAddress(stationData: {
    name: string;
    addressStreet: string;
    addressCity: string;
  }) {
    return await prisma.station.findUnique({
      where: {
        name_addressStreet_addressCity: {
          name: stationData.name,
          addressStreet: stationData.addressStreet,
          addressCity: stationData.addressCity,
        },
      },
    });
  }
  static async findStationById(stationId: string) {
    return await prisma.station.findUnique({
      where: { id: stationId },
    });
  }
  static async getAvailableStations({ skip = 0, take = 10 } = {}) {
    return prisma.station.findMany({
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
  static async search(query: string, { skip = 0, take = 10 } = {}) {
    return await prisma.station.findMany({
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
  static async updateAvailability(stationId: string, isAvailable: boolean) {
    return await prisma.station.update({
      where: { id: stationId },
      data: { isAvailable, updatedAt: new Date() },
    });
  }
  static async updateStation(
    stationId: string,
    stationData: Partial<StationDTO>,
  ) {
    return await prisma.station.update({
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
  static async deleteStation(stationId: string) {
    return await prisma.station.delete({
      where: { id: stationId },
    });
  }
}
