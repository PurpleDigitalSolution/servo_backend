import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/async.js";
import pricingService, { PricingService } from "./pricing.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * GET /api/v1/pricing/settings
   * Retrieve current global pricing settings
   */
  readonly getSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await this.pricingService.getSettings();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          settings,
          "Pricing settings retrieved successfully",
        ),
      );
  });
  readonly getSettingsForUser = asyncHandler(
    async (req: Request, res: Response) => {
      const settings = await this.pricingService.getSettingsForUser();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            settings,
            "Pricing settings for user retrieved successfully",
          ),
        );
    },
  );
  /**
   * PUT /api/v1/pricing/settings
   * Update existing pricing settings
   */
  readonly updateSettings = asyncHandler(
    async (req: Request, res: Response) => {
      const updatedSettings = await this.pricingService.updateSettings(
        req.body,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedSettings,
            "Pricing settings updated successfully",
          ),
        );
    },
  );

  /**
   * POST /api/v1/pricing/calculate
   * Calculate subtotal, delivery fee, VAT, and grand total
   */
  readonly calculatePrice = asyncHandler(
    async (req: Request, res: Response) => {
      const { subtotal } = req.body;

      const breakdown = await this.pricingService.calculateOrderPrice(
        Number(subtotal),
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            breakdown,
            "Order price calculated successfully",
          ),
        );
    },
  );
}

const pricingController = new PricingController(pricingService);
export default pricingController;
