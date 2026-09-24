import { prisma } from "../../../config/database.js";
import { PriceSettings } from "../../../interface/pricing.js";

export interface GetSettingsResponse extends PriceSettings {
  id: string;
  deliveryFeeId: string;
  vatId: string;
}

export interface IPricingRepository {
  createSettings: (data: PriceSettings) => Promise<GetSettingsResponse>;
  getSettings: () => Promise<GetSettingsResponse | null>; // Allowed null here
  updateSettings: (
    id: string,
    data: Partial<PriceSettings>,
  ) => Promise<GetSettingsResponse>;
}

export class PricingSettingRepository implements IPricingRepository {
  async createSettings(data: PriceSettings): Promise<GetSettingsResponse> {
    return prisma.priceSettings.create({
      data: {
        deliveryFee: {
          create: {
            isEnable: data.deliveryFee.isEnable,
            value: data.deliveryFee.value,
          },
        },
        vat: {
          create: {
            isEnable: data.vat.isEnable,
            value: data.vat.value,
          },
        },
      },
      include: {
        deliveryFee: true,
        vat: true,
      },
    }) as unknown as GetSettingsResponse;
  }

  async getSettings(): Promise<GetSettingsResponse | null> {
    const settings = await prisma.priceSettings.findFirst({
      include: {
        deliveryFee: true,
        vat: true,
      },
    });

    return settings as unknown as GetSettingsResponse | null;
  }

  async updateSettings(
    id: string,
    data: Partial<PriceSettings>,
  ): Promise<GetSettingsResponse> {
    return prisma.priceSettings.update({
      where: { id },
      data: {
        deliveryFee: data.deliveryFee
          ? {
              update: {
                isEnable: data.deliveryFee.isEnable,
                value: data.deliveryFee.value,
              },
            }
          : undefined,
        vat: data.vat
          ? {
              update: {
                isEnable: data.vat.isEnable,
                value: data.vat.value,
              },
            }
          : undefined,
      },
      include: {
        deliveryFee: true,
        vat: true,
      },
    }) as unknown as GetSettingsResponse;
  }
}

const pricingSettingRepository = new PricingSettingRepository();
export default pricingSettingRepository;
