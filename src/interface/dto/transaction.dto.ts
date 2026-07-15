import { PaymentMethod, PaymentStatus } from "../../types/general.js";

export interface TransactionDTO {
  orderId: string;
  reference: string;
  amount: number;
  paymentMethod: PaymentMethod;
  authorizationUrl?: string;
}

export interface InitializeDTO {
  amount: number;
  email: string;
  reference: string;
  metadata: {
    orderId: string;
    reference_id: string;
  };
}
export interface InitializeResponseDTO {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
export interface VerifyResponseDTO {
  status: boolean;
  data: {
    status: string;
  };
}

export interface TransactionUpdateDTO {
  paidAt: string;
  status: PaymentStatus;
}
