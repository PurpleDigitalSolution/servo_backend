import { sender, Transporter } from "../config/mail.config.js";
import { Resend } from "resend";
import {
  OtpTemplate,
  resetPasswordTemplate,
} from "../email/templates/Otp.template.js";
import config from "../config/config.js";
import { Transporter as TransporterTy } from "nodemailer";
interface mailArgs {
  email: string;
  subject: string;
  html: string;
}
const testEnv = "test";
export class EmailService {
  private transporter!: TransporterTy;
  private resendClient;
  private sender = sender;

  constructor() {
    if (process.env.RESEND_API_KEY && testEnv !== "test") {
      try {
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        console.log("Resend client initialized successfully.");
      } catch (error) {
        console.error(
          "Error occurred while initializing Resend client:",
          error,
        );
      }
    } else {
      console.log("using nodemailer with gmail");
      this.transporter = Transporter;
      // verify if the transporter is working properly
      this.transporter
        .verify()
        .then(() => {
          console.log("Nodemailer transporter verified successfully.");
        })
        .catch((error) => {
          console.error(
            "Error occurred while verifying Nodemailer transporter:",
            error,
          );
        });
    }
  }

  private mailOptions({
    email,
    subject,
    html,
  }: {
    email: string;
    subject: string;
    html: string;
  }) {
    return {
      from: this.sender,
      to: email,
      subject,
      html,
    };
  }

  private async send(options: mailArgs) {
    try {
      if (this.resendClient) {
        const response = await this.resendClient.emails.send({
          from: this.sender,
          to: options.email,
          subject: options.subject,
          html: options.html,
        });
        return response;
      }

      if (!this.transporter) {
        throw new Error("Email transporter not initialized.");
      }

      const mailOptions = this.mailOptions(options);
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      throw error;
    }
  }
  async sendVerificationEmail(email: string, name: string, token: string) {
    const html = OtpTemplate(token, name);
    await this.send({
      email,
      subject: "Email Verification",
      html,
    });
  }
  async sendResetPasswordEmail(email: string, name: string, token: string) {
    const resetLink = `${config.CORS_ORIGIN}/auth/reset-password?token=${token}`;
    const html = resetPasswordTemplate(resetLink, name);
    await this.send({
      email,
      subject: "Reset Password",
      html,
    });
  }
}
