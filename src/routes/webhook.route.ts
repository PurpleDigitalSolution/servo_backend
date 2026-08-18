import express from "express";
import { paystackWebhook } from "../service/Payments/gateway/Paystack/webhook.js";
import { flutterwaveWebhook } from "../service/Payments/gateway/Flutterwave/webhook.js";

const WebHookRouter = express.Router();

WebHookRouter.post("/paystack", paystackWebhook);
WebHookRouter.post("/flutterwave", flutterwaveWebhook);

export default WebHookRouter;
