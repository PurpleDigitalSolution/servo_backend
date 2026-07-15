import nodemailer from "nodemailer";
import { config } from "./config.js";

export const Transporter = nodemailer.createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_SERVICE === "gmail" ? false : true, // true for 465, false for other ports
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

export const sender = `<onboarding@resend.dev>`;
