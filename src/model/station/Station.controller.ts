import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async.js";
import { StationService } from "./Station.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createStation = asyncHandler(
  async (req: Request, res: Response) => {
    const stationData = req.body;
    const result = await StationService.createStation(stationData);
    res
      .status(201)
      .json(new ApiResponse(201, result, "Station created successfully"));
  },
);
export const getStations = asyncHandler(async (req: Request, res: Response) => {
  const { limit, page } = req.query;
  const result = await StationService.getStations(
    limit as string,
    page as string,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Stations retrieved successfully"));
});
export const getStationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await StationService.getStationById(id as string);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Station retrieved successfully"));
  },
);
export const updateAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const result = await StationService.updateAvailability(
      id as string,
      isAvailable as boolean,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Station availability updated  successfully",
        ),
      );
  },
);
export const getAvailableStations = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit, page } = req.query;
    const result = await StationService.getAvailableStations(
      limit as string,
      page as string,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Available stations retrieved successfully",
        ),
      );
  },
);
