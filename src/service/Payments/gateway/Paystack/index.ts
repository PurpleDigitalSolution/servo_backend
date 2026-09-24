import axios, { AxiosInstance, isAxiosError } from "axios";
import { InitializeDTO } from "../../../../interface/dto/transaction.dto.js";
import { config } from "../../../../config/config.js";
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
  // No response at all = network error/timeout — also worth retrying
  if (!err.response) return true;
  return RETRYABLE_STATUSES.has(err.response.status);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      timeout: 8000, // don't let a hung request outlive callers that depend on this finishing fast
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    // NOTE: this interceptor now runs BEFORE our retry logic gets to inspect
    // the raw axios error, so it needs to preserve status/retryability info
    // rather than collapsing everything into a plain Error.
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const gatewayMessage =
          error.response?.data?.message || "Paystack Gateway Error";
        const status = error.response?.status || 502;

        const wrapped = new GatewayError(
          `Paystack Gateway Error: ${gatewayMessage}`,
          status,
        );
        // carry the original axios error forward so isRetryableGatewayError still works
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
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // 300ms, 600ms
        await sleep(delay);
        return this.requestWithRetry(fn, attempt + 1);
      }
      throw err;
    }
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
      email: payload.customer.email,
      redirect_url: payload.redirect_url,
      metadata: {
        orderId: payload.metadata?.orderId ?? "",
        reference_id: payload.metadata?.reference_id ?? "",
      },
    };

    const response = await this.requestWithRetry(() =>
      this.client.post("/transaction/initialize", builtPayload),
    );

    const body = response.data;

    return {
      status: body.status ? "success" : "failed",
      message: body.message,
      data: {
        authorization_url: body.data?.authorization_url ?? "",
        access_code: body.data?.access_code ?? "",
        tx_ref: payload.tx_ref,
      },
    };
  }

  async verify(reference: string): Promise<VerifiedPayment> {
    const response = await this.requestWithRetry(() =>
      this.client.get(`/transaction/verify/${reference}`),
    );
    const body = response.data;

    const isSuccessful =
      body.status === true && body.data?.status === "success";

    return {
      status: isSuccessful ? "successful" : "failed",
      success: isSuccessful,
      data: body.data,
    };
  }
}
