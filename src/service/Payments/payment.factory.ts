import { providerType } from "../../types/general.js";
import { FlutterwaveGateWay } from "./gateway/Flutterwave/index.js";
import { PayStackGateWay } from "./gateway/Paystack/index.js";
import { PaymentGateway, PaymentProvider } from "./payment.interface.js";

export class PaymentFactory {
  constructor(
    private readonly paystack: PayStackGateWay,
    private readonly flutterwave: FlutterwaveGateWay,
  ) {}

  getGateWay(provider: providerType): PaymentGateway {
    // Normalize to uppercase for safety
    const normalizedProvider = (provider || "").toString().toUpperCase();

    switch (normalizedProvider) {
      case PaymentProvider.PAYSTACK:
      case "PAYSTACK":
        return this.paystack;

      case PaymentProvider.FLUTTERWAVE:
      case "FLUTTERWAVE":
        return this.flutterwave;

      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }
}

export const paymentFactory = new PaymentFactory(
  new PayStackGateWay(),
  new FlutterwaveGateWay(),
);
