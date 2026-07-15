import express from "express";
import { webhook } from "../webhook/paystack.webhook.js";

const WebHookRouter = express.Router();

WebHookRouter.post("/paystack", webhook);

export default WebHookRouter;
