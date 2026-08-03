import { PaymentStatus, providerType } from "../../types/general.js";

export interface TransactionDTO {
  orderId: string;
  reference: string;
  amount: number;
  paymentMethod: providerType;
  authorizationUrl?: string;
}

export interface InitializeDTO {
  amount: number;
  email: string;
  reference: string;
  redirect_url: string;
  metadata: {
    orderId: string;
    reference_id: string;
  };
}
export interface FlutterwaveInitializeDTO {
  amount: number;
  tx_ref: string;
  currency: string;
  redirect_url: string;
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
  meta?: Record<string, any>;
}

export interface FlutterwaveInitializeResponseDTO {
  status: string;
  message: string;
  data: {
    link: string;
    access_code?: string;
  };
}

export interface InitializeResponseDTO {
  status: string;
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
  paidAt?: string;
  status: PaymentStatus;
  failureReason?: string;
}
