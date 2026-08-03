import axios, { AxiosInstance } from "axios";
import { config } from "../../../../config/config.js";
import { FlutterwaveInitializeDTO } from "../../../../interface/dto/transaction.dto.js";
import {
  InitializeResponse,
  ITransactionInitializeDTo,
  PaymentGateway,
  VerifiedPayment,
} from "../../payment.interface.js";

export class FlutterwaveGateWay implements PaymentGateway {
  private readonly client: AxiosInstance;

  constructor() {
    const baseUrl =
      config.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
    const secretKey = config.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "Missing system environment credential: FLUTTERWAVE_SECRET_KEY",
      );
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const gatewayMessage =
          error.response?.data?.message || "Flutterwave Gateway Error";
        const status = error.response?.status || 502;
        return Promise.reject(
          new Error(`[Gateway Error ${status}]: ${gatewayMessage}`),
        );
      },
    );
  }

  /**
   * Transmits initialization payload data directly to the Flutterwave gateway endpoint.
   */
  async initialize(
    payload: ITransactionInitializeDTo,
  ): Promise<InitializeResponse> {
    const builtPayload: FlutterwaveInitializeDTO = {
      amount: payload.amount,
      tx_ref: payload.tx_ref,
      currency: "NGN",
      redirect_url: payload.redirect_url,
      customer: payload.customer,
      customizations: payload.customizations,
      meta: payload.metadata,
    };

    const response = await this.client.post("/payments", builtPayload);
    const body = response.data;

    return {
      status: body.status,
      message: body.message,
      data: {
        authorization_url: body.data?.link ?? "",
        access_code: body.data?.access_code ?? "",
        tx_ref: payload.tx_ref,
      },
    };
  }

  async verify(reference: string): Promise<VerifiedPayment> {
    const response = await this.client.get(
      `/transactions/verify_by_reference`,
      {
        params: {
          tx_ref: reference,
        },
      },
    );

    const body = response.data;
    const isSuccessful =
      body.status === "success" && body.data?.status === "successful";

    return {
      status: isSuccessful ? "successful" : "failed",
      success: isSuccessful,
      data: body.data,
    };
  }
}
