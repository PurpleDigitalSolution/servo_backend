import axios, { AxiosInstance } from "axios";
import { InitializeDTO } from "../../../../interface/dto/transaction.dto.js";
import { config } from "../../../../config/config.js";
import {
  InitializeResponse,
  ITransactionInitializeDTo,
  PaymentGateway,
  VerifiedPayment,
} from "../../payment.interface.js";

export class PayStackGateWay implements PaymentGateway {
  private readonly client: AxiosInstance;

  constructor() {
    const baseUrl = config.PAYSTACK_BASE_URL || "https://api.paystack.co";
    const secretKey = config.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "Missing system environment credential: PAYSTACK_SECRET_KEY",
      );
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const gatewayMessage =
          error.response?.data?.message || "Paystack Gateway Error";
        const status = error.response?.status || 502;

        return Promise.reject(
          new Error(`[Gateway Error ${status}]: ${gatewayMessage}`),
        );
      },
    );
  }

  /**
   * Transmits initialization payload data directly to the Paystack gateway endpoint.
   */
  async initialize(
    payload: ITransactionInitializeDTo,
  ): Promise<InitializeResponse> {
    // Paystack requires amount in lowest currency unit (e.g. Kobo: ₦1000 = 100000)
    const amountInKobo = Math.round(payload.amount * 100);

    const builtPayload: InitializeDTO = {
      amount: amountInKobo,
      reference: payload.tx_ref,
      email: payload.customer.email, // ✅ Fixed: Passed email instead of name
      redirect_url: payload.redirect_url,
      metadata: {
        orderId: payload.metadata?.orderId ?? "",
        reference_id: payload.metadata?.reference_id ?? "",
      },
    };

    const response = await this.client.post(
      "/transaction/initialize",
      builtPayload,
    );

    const body = response.data; // { status: true, message: "...", data: { authorization_url: "..." } }

    return {
      status: body.status ? "success" : "failed",
      message: body.message,
      data: {
        authorization_url: body.data?.authorization_url ?? "", // ✅ Correct property path
        access_code: body.data?.access_code ?? "",
        tx_ref: payload.tx_ref,
      },
    };
  }

  async verify(reference: string): Promise<VerifiedPayment> {
    const response = await this.client.get(`/transaction/verify/${reference}`);
    const body = response.data;

    // ✅ Paystack sets body.status to true and body.data.status to "success"
    const isSuccessful =
      body.status === true && body.data?.status === "success";

    return {
      status: isSuccessful ? "successful" : "failed",
      success: isSuccessful,
      data: body.data,
    };
  }
}
