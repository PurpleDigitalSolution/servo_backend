import axios, { AxiosInstance, isAxiosError } from "axios";

import { config } from "../../../../config/config.js";
import { FlutterwaveInitializeDTO } from "../../../../interface/dto/transaction.dto.js";

import {
  InitializeResponse,
  ITransactionInitializeDTo,
  PaymentGateway,
  VerifiedPayment,
} from "../../payment.interface.js";
import { GatewayError } from "../../../../utils/errorHandler.js";

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 300;

function isRetryableGatewayError(err: unknown): boolean {
  if (!isAxiosError(err)) return false;

  // No response = network error / timeout.
  if (!err.response) return true;

  return RETRYABLE_STATUSES.has(err.response.status);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      timeout: 8000,
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

        const wrapped = new GatewayError(
          `Flutterwave Gateway Error: ${gatewayMessage}`,
          status,
        );

        // Preserve the original Axios error so retry logic
        // can still inspect response status/network errors.
        (wrapped as any).cause = error;
        (wrapped as any).status = status;

        return Promise.reject(wrapped);
      },
    );
  }

  private async requestWithRetry<T>(
    fn: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const original = (err as any)?.cause ?? err;

      if (isRetryableGatewayError(original) && attempt < MAX_ATTEMPTS) {
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1);

        await sleep(delay);

        return this.requestWithRetry(fn, attempt + 1);
      }

      throw err;
    }
  }

  /**
   * Transmits initialization payload data directly to the
   * Flutterwave gateway endpoint.
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

    const response = await this.requestWithRetry(() =>
      this.client.post("/payments", builtPayload),
    );

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
    const response = await this.requestWithRetry(() =>
      this.client.get("/transactions/verify_by_reference", {
        params: {
          tx_ref: reference,
        },
      }),
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
