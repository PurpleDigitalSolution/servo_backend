export interface ITransactionInitializeDTo {
  amount: number;
  tx_ref: string;
  redirect_url: string;
  metadata?: {
    orderId: string;
    reference_id: string;
  };
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}
export interface InitializeResponse {
  status: string;
  message: string;
  data: {
    authorization_url: string;
    access_code?: string;
    tx_ref: string;
  };
}
export interface VerifiedPayment {
  status: string;
  success: boolean;
  data?: any;
}
export const PaymentProvider = {
  PAYSTACK: "PAYSTACK",
  FLUTTERWAVE: "FLUTTERWAVE",
};
export interface PaymentGateway {
  initialize(
    transaction: ITransactionInitializeDTo,
  ): Promise<InitializeResponse>;
  verify(reference: string): Promise<VerifiedPayment>;
  // handleWebhook(payload: unknown): Promise<void>;
}
