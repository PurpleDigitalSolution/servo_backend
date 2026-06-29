import express from 'express';
import dotenv from 'dotenv';
import cors from "cors"

import cookieParser from 'cookie-parser';
dotenv.config()

const app = express();
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
      }else{
        console.log(`Blocked CORS request from origin: ${requestOrigin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "X-Idempotency-Key",
    ],
    credentials: true,
  })
)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
export default app;