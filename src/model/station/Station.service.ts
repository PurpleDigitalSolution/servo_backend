import { StationDTO } from "../../interface/dto/station.dto.js";
import { ApiError } from "../../utils/errorHandler.js";
import { StationRepository } from "./Station.repository.js";

export class StationService {
  static async createStation(stationData: StationDTO) {
    const existingStation = await StationRepository.findStationByNameAndAddress(
      {
        name: stationData.name,
        addressStreet: stationData.addressStreet,
        addressCity: stationData.addressCity,
      },
    );
    if (existingStation) {
      throw new ApiError(
        400,
        "Station with the same name and address already exists",
      );
    }
    return await StationRepository.createStation(stationData);
  }
  static async getStations(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;
    const [stations, totalStations] = await Promise.all([
      StationRepository.getStations(skip, take),
      StationRepository.count(),
    ]);
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalStations / take),
      totalStations,
    };

    return { stations, pagination };
  }
  static async getStationById(stationId: string) {
    const station = await StationRepository.findStationById(stationId);
    return station;
  }
  static async getAvailableStations(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 5));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;
    const [stations, totalStations] = await Promise.all([
      StationRepository.getAvailableStations({ skip, take }),
      StationRepository.count(),
    ]);
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalStations / take),
      totalStations,
    };
    return { stations, pagination };
  }
  static async updateAvailability(stationId: string, isAvailable: boolean) {
    return await StationRepository.updateAvailability(stationId, isAvailable);
  }
  static async findStationById(stationId: string) {
    return await StationRepository.findStationById(stationId);
  }
  static async search(
    query: string,
    { limit = "10", page = "1" }: { limit: string; page: string },
  ) {
    const take = Math.min(100, Math.max(1, Number(limit) || 10));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;
    return await StationRepository.search(query, { skip, take });
  }
  static async updateStation(
    stationId: string,
    stationData: Partial<StationDTO>,
  ) {
    const cleanDTO = Object.fromEntries(
      Object.entries(stationData).filter(([_, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === "string") {
          return value.trim() !== "";
        }
        return true;
      }),
    );
    return await StationRepository.updateStation(stationId, cleanDTO);
  }
  static async deleteStation(stationId: string) {
    return await StationRepository.deleteStation(stationId);
  }
}
