import { providerType } from "../../types/general.js";
import { paymentFactory, PaymentFactory } from "./payment.factory.js";
import {
  InitializeResponse,
  ITransactionInitializeDTo,
  VerifiedPayment,
} from "./payment.interface.js";

export interface IPaymentService {
  initialize(
    transaction: ITransactionInitializeDTo,
    provider: providerType,
  ): Promise<InitializeResponse>;
  verify(reference: string, provider: providerType): Promise<VerifiedPayment>;
}

export class PaymentService implements IPaymentService {
  constructor(private readonly factory: PaymentFactory) {}

  async initialize(
    transaction: ITransactionInitializeDTo,
    provider: providerType,
  ): Promise<InitializeResponse> {
    const gateway = this.factory.getGateWay(provider);
    return await gateway.initialize(transaction);
  }

  async verify(
    reference: string,
    provider: providerType,
  ): Promise<VerifiedPayment> {
    const gateway = this.factory.getGateWay(provider);
    return await gateway.verify(reference);
  }
}

// Export singleton instance
export const paymentService = new PaymentService(paymentFactory);
