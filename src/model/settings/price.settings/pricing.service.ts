import { PriceSettings } from "../../../interface/pricing.js";
import pricingSettingRepository, {
  IPricingRepository,
} from "./pricing.repository.js";

export class PricingService {
  constructor(private readonly pricingRepository: IPricingRepository) {}
  async getSettingsForUser() {
    return await this.pricingRepository.getSettings();
  }
  async getSettings() {
    let settings = await this.pricingRepository.getSettings();

    if (!settings) {
      const defaultSettings: PriceSettings = {
        deliveryFee: { isEnable: true, value: 0 },
        vat: { isEnable: false, value: 0 },
      };
      settings = await this.pricingRepository.createSettings(defaultSettings);
    }

    return settings;
  }
  async updateSettings(data: Partial<PriceSettings>) {
    const existing = await this.pricingRepository.getSettings();

    if (!existing) {
      const initialPayload: PriceSettings = {
        deliveryFee: {
          isEnable: data.deliveryFee?.isEnable ?? true,
          value: data.deliveryFee?.value ?? 0,
        },
        vat: {
          isEnable: data.vat?.isEnable ?? false,
          value: data.vat?.value ?? 0,
        },
      };
      return await this.pricingRepository.createSettings(initialPayload);
    }

    return await this.pricingRepository.updateSettings(existing.id, data);
  }

  /**
   * Calculates the final breakdown for a order total based on active VAT and delivery fee settings.
   */
  async calculateOrderPrice(subtotal: number) {
    const settings = await this.getSettings();

    const deliveryFee = settings.deliveryFee.isEnable
      ? Number(settings.deliveryFee.value)
      : 0;

    const vatAmount = settings.vat.isEnable
      ? (subtotal * Number(settings.vat.value)) / 100
      : 0;

    const grandTotal = subtotal + deliveryFee + vatAmount;

    return {
      subtotal,
      deliveryFee,
      vatAmount,
      grandTotal,
    };
  }
}

const pricingService = new PricingService(pricingSettingRepository);
export default pricingService;
