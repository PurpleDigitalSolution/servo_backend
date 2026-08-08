import { sender, Transporter } from "../config/mail.config.js";
import { Resend } from "resend";
import {
  defaultLoginCredentialsTemplate,
  OtpTemplate,
  resetPasswordTemplate,
} from "../email/templates/email.template.js";
import config from "../config/config.js";
import { Transporter as TransporterTy } from "nodemailer";

interface MailArgs {
  email: string;
  subject: string;
  html: string;
}

interface EmailServiceInterface {
  sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
  sendResetPasswordEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
  sendDefaultLoginCredentials(
    email: string,
    password: string,
    name?: string,
  ): Promise<void>;
  sendTestEmail(email: string, subject?: string, html?: string): Promise<void>;
}

export class EmailService implements EmailServiceInterface {
  private transporter?: TransporterTy;
  private resendClient?: Resend;
  private sender: string = sender;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      try {
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        console.log("Resend client initialized successfully.");
      } catch (error) {
        console.error("Error initializing Resend client:", error);
      }
    } else {
      console.log("Using Nodemailer with SMTP/Gmail fallback.");
      this.transporter = Transporter;
    }
  }

  private async send(options: MailArgs) {
    try {
      // 1. Resend Provider Path
      if (this.resendClient) {
        const { data, error } = await this.resendClient.emails.send({
          from: this.sender,
          to: options.email,
          subject: options.subject,
          html: options.html,
        });

        if (error) {
          console.error("Resend API error:", error);
          throw new Error(`Resend Delivery Failed: ${error.message}`);
        }

        return data;
      }

      // 2. Nodemailer Fallback Path
      if (!this.transporter) {
        throw new Error("No active email transporter initialized.");
      }

      const info = await this.transporter.sendMail({
        from: this.sender,
        to: options.email,
        subject: options.subject,
        html: options.html,
      });

      return info;
    } catch (error) {
      console.error("Failed to send email via primary provider:", error);
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

  async sendDefaultLoginCredentials(
    email: string,
    password: string,
    name?: string,
  ) {
    const html = defaultLoginCredentialsTemplate(email, password, name);
    await this.send({
      email,
      subject: "Your Default Login Credentials",
      html,
    });
  }

  async sendTestEmail(
    email: string,
    subject = "Servo email test",
    html = "<p>This is a test email from Servo.</p>",
  ) {
    await this.send({
      email,
      subject,
      html,
    });
  }
}
