import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { swaggerMiddleware } from "./docs/swagger.js";

import cookieParser from "cookie-parser";
import helmetMiddleware from "./utils/helmet.js";
import { errorHandler } from "./utils/errorHandler.js";
import router from "./routes/index.js";
dotenv.config();

const app = express();

app.use(helmetMiddleware);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];
// app.disable("etag");
app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      } else {
        console.log(`Blocked CORS request from origin: ${requestOrigin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Idempotency-Key",
    ],
    credentials: true,
  }),
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api-docs", ...swaggerMiddleware);
app.use("/api/v1", router);
app.use(errorHandler);
export default app;
