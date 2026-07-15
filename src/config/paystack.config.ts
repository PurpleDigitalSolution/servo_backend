import axios, { AxiosInstance } from "axios";
import { config } from "./config.js";
import {
  InitializeDTO,
  InitializeResponseDTO,
  VerifyResponseDTO,
} from "../interface/dto/transaction.dto.js";

// 1. Define an interface layout contract for the payment gateway service client
export interface IPaymentGateway {
  initializeTransaction(payload: InitializeDTO): Promise<InitializeResponseDTO>;
  verifyTransaction(reference: string): Promise<VerifyResponseDTO>;
}

export class PayStack implements IPaymentGateway {
  private readonly client: AxiosInstance;

  constructor() {
    // 2. Safely derive configs from centralized configuration parameters
    const baseUrl = config.PAYSTACK_BASE_URL || "https://api.paystack.co";
    const secretKey = config.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "Missing system environment credential: PAYSTACK_SECRET_KEY",
      );
    }

    // 3. Rename uninformative variable "_" to "client" and configure
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    // 4. Optional: Embed interceptors to catch and structure external gateway errors cleanly
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Formats raw Axios errors into informative context before passing down the call stack
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
  async initializeTransaction(
    payload: InitializeDTO,
  ): Promise<InitializeResponseDTO> {
    const response = await this.client.post<InitializeResponseDTO>(
      "/transaction/initialize",
      payload,
    );
    return response.data;
  }
  async verifyTransaction(reference: string): Promise<VerifyResponseDTO> {
    const response = await this.client.get<VerifyResponseDTO>(
      `/transaction/verify/${reference}`,
    );
    return response.data;
  }
}
