import { StationDTO } from "../../interface/dto/station.dto.js";
import { ApiError } from "../../utils/errorHandler.js";
import { IStationRepository } from "./Station.repository.js";

export class StationService {
  // Inject the repository contract through the constructor
  constructor(private readonly stationRepository: IStationRepository) {}

  async createStation(stationData: StationDTO) {
    const existingStation =
      await this.stationRepository.findStationByNameAndAddress({
        name: stationData.name,
        addressStreet: stationData.addressStreet,
        addressCity: stationData.addressCity,
      });

    if (existingStation) {
      throw new ApiError(
        400,
        "Station with the same name and address already exists",
      );
    }

    return await this.stationRepository.createStation(stationData);
  }

  async getStations(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [stations, totalStations] = await Promise.all([
      this.stationRepository.getStations(skip, take),
      this.stationRepository.count(),
    ]);

    return {
      stations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalStations / take),
        totalStations,
      },
    };
  }

  async getStationById(stationId: string) {
    return await this.stationRepository.findStationById(stationId);
  }

  async getAvailableStations(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 5));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    // FIXED: Passed the availability filter directly down to count the true total subset
    const availableFilter = { isAvailable: true };

    const [stations, totalStations] = await Promise.all([
      this.stationRepository.getAvailableStations({ skip, take }),
      this.stationRepository.count(availableFilter),
    ]);

    return {
      stations,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalStations / take),
        totalStations,
      },
    };
  }

  async updateAvailability(stationId: string, isAvailable: boolean) {
    return await this.stationRepository.updateAvailability(
      stationId,
      isAvailable,
    );
  }

  async findStationById(stationId: string) {
    return await this.stationRepository.findStationById(stationId);
  }

  async search(
    query: string,
    { limit = "10", page = "1" }: { limit: string; page: string },
  ) {
    const take = Math.min(100, Math.max(1, Number(limit) || 10));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    return await this.stationRepository.search(query, { skip, take });
  }

  async updateStation(stationId: string, stationData: Partial<StationDTO>) {
    const cleanDTO = Object.fromEntries(
      Object.entries(stationData).filter(([_, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === "string") return value.trim() !== "";
        return true;
      }),
    );

    return await this.stationRepository.updateStation(stationId, cleanDTO);
  }

  async deleteStation(stationId: string) {
    return await this.stationRepository.deleteStation(stationId);
  }
}
