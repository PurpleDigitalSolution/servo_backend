export type FlutterwaveEvent =
  | "charge.completed"
  | "charge.failed"
  | "transfer.completed"
  | "transfer.failed"
  | "refund.processed";

interface FlutterwaveData {
  id: number;
  tx_ref: string;
  flw_ref: string;
  device_fingerprint: string;
  amount: number;
  currency: string;
  charged_amount: number;
  app_fee: number;
  merchant_fee: number;
  processor_response: string;
  auth_model: string;
  ip: string;
  narrative: string;
  status: "successful" | "failed" | "pending"; // Add other statuses as needed
  payment_type: string;
  created_at: string; // ISO date string
  account_id: number;
  customer: {
    id: number;
    name: string;
    phone_number: string;
    email: string;
    created_at: string; // ISO date string
  };
  card: {
    first_6digits: string;
    last_4digits: string;
    issuer: string;
    country: string;
    type: string;
    expiry: string; // Format: "MM/YY"
  };
}
export interface FlutterwaveWebhookEvent {
  event: FlutterwaveEvent;
  data: FlutterwaveData;
}
