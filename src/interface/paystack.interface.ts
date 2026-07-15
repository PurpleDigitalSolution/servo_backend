export interface PaystackTransactionData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string | null;
  fees: number | null;

  customer: PaystackCustomer;

  authorization?: PaystackAuthorization;

  metadata?: Record<string, unknown>;
}

export interface PaystackCustomer {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
}

export type PaystackEvent =
  | "charge.success"
  | "charge.failed"
  | "transfer.success"
  | "transfer.failed"
  | "refund.processed";

export interface PaystackWebhookEvent {
  event: PaystackEvent;
  data: PaystackTransactionData;
}
