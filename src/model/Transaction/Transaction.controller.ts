import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async.js";
import { TransactionService } from "./Transaction.service.js";
import { TransactionRepo } from "./Transaction.repository.js";
import { OrderRepository } from "../order/Order.repository.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { paymentService } from "../../service/Payments/payment.service.js";
const transactionRepo = new TransactionRepo();

const orderRepo = new OrderRepository();
const transactionService = new TransactionService(
  transactionRepo,
  paymentService,
  orderRepo,
);

export const getOrderPendingTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result = await transactionService.findPendingTransactionByOrderId(
      orderId as string,
    );

    res.status(200).json(new ApiResponse(200, result, "Transaction fetched"));
  },
);
export const getOrderTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result = await transactionService.findTransactionByOrderId(
      orderId as string,
    );

    res.status(200).json(new ApiResponse(200, result, "Transaction fetched"));
  },
);

export const verifyTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const { reference, orderId } = req.query;

    const result = await transactionService.verify({
      reference: reference as string | undefined,
      orderId: orderId as string | undefined,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          result.message || "Transaction verification completed",
        ),
      );
  },
);
