import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  CreateUserDTO,
  userWithoutPassword,
} from "../../interface/user.interface.js";
import { ApiError } from "../../utils/errorHandler.js";
import { SessionService } from "../../utils/Session.js";
import { generateOTP, generateRandomToken } from "../../utils/generator.js";
import { EmailService } from "../../service/email.service.js";
import { Response, Request } from "express";

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<any | null>;
  findUserByEmailForOtp(email: string): Promise<any | null>;
  findUserById(id: string): Promise<any | null>;
  findUserByToken(token: string): Promise<any | null>;
  createUserAccount(dto: CreateUserDTO): Promise<any>;
  updateUserOtp(
    userId: string,
    hashedOtp: string | null,
    expiry: Date | null,
  ): Promise<void>;
  updateUserToken(
    userId: string,
    token: string | null,
    expiry: Date | null,
  ): Promise<void>;
  updateUserVerificationStatus(userId: string, status: string): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
}

export class AuthenticationService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly emailService: EmailService,
    private readonly sessionService: typeof SessionService, // Keeps utility clean
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Fast, secure hash function for short-lived OTP verification.
   * Prevents CPU-exhaustion DoS attacks while keeping database leaks safe.
   */
  private hashOtp(otp: string): string {
    return crypto
      .createHmac("sha256", process.env.OTP_HMAC_SECRET || "fallback_secret")
      .update(otp)
      .digest("hex");
  }

  async registerUser(dto: CreateUserDTO): Promise<any> {
    const userExists = await this.authRepository.findUserByEmail(dto.email);
    if (userExists) {
      throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);
    return await this.authRepository.createUserAccount({
      ...dto,
      password: passwordHash,
    });
  }

  async login(email: string, password: string): Promise<userWithoutPassword> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async logout(res: Response, req: Request): Promise<void> {
    if (!req.user) {
      throw new ApiError(401, "No active session found");
    }

    const { userId, sessionId } = req.user;
    if (!sessionId) {
      throw new ApiError(400, "Session ID missing from token status");
    }

    await this.sessionService.clearFrom(res, userId, sessionId);
  }

  async getAuthenticatedUser(req: Request): Promise<userWithoutPassword> {
    if (!req.user) {
      throw new ApiError(401, "No active session found");
    }

    const user = await this.authRepository.findUserById(req.user.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgetPassword(email: string): Promise<void> {
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const secureHashedOtp = this.hashOtp(otp);

    // Save state first
    await this.authRepository.updateUserOtp(
      user.id,
      secureHashedOtp,
      otpExpiry,
    );

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.userProfile?.firstName ?? "User",
        otp,
      );
    } catch {
      // Rollback database state to prevent broken/unreachable OTP records
      await this.authRepository.updateUserOtp(user.id, null, null);
      throw new ApiError(
        500,
        "Failed to send verification email. Please try again.",
      );
    }
  }

  async verifyOtp(
    email: string,
    otp: string,
    purpose: "FORGET_PASSWORD" | "EMAIL_VERIFICATION",
  ): Promise<{ success: boolean; resetToken?: string }> {
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const user = await this.authRepository.findUserByEmailForOtp(email);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Defensive check: Ensure an OTP actually exists in the database
    if (!user.otp || !user.otpExpiry) {
      throw new ApiError(400, "No active verification requests found");
    }

    if (user.otpExpiry < new Date()) {
      // Clear expired OTP immediately
      await this.authRepository.updateUserOtp(user.id, null, null);
      throw new ApiError(400, "OTP has expired");
    }

    // Compare fast SHA-256 HMACs instead of slow bcrypt hashes
    const secureIncomingOtp = this.hashOtp(otp);
    const isOtpValid = crypto.timingSafeEqual(
      Buffer.from(secureIncomingOtp, "utf-8"),
      Buffer.from(user.otp, "utf-8"),
    );

    if (!isOtpValid) {
      throw new ApiError(400, "Invalid OTP");
    }

    // Clear single-use OTP immediately after successful verification
    await this.authRepository.updateUserOtp(user.id, null, null);

    if (purpose === "FORGET_PASSWORD") {
      const token = generateRandomToken(32);
      const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await this.authRepository.updateUserToken(user.id, token, tokenExpiry);

      await this.emailService.sendResetPasswordEmail(
        user.email,
        user.userProfile?.firstName ?? "User",
        token,
      );

      return { success: true, resetToken: token };
    } else {
      await Promise.all([
        this.authRepository.updateUserVerificationStatus(user.id, "VERIFIED"),
        this.authRepository.updateUserToken(user.id, null, null),
      ]);
      return { success: true };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new ApiError(400, "Token and new password are required");
    }

    const user = await this.authRepository.findUserByToken(token);
    if (!user || !user.tokenExpiry || user.tokenExpiry < new Date()) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    // Batch operations to maintain consistency
    await Promise.all([
      this.authRepository.updateUserPassword(user.id, hashedPassword),
      this.authRepository.updateUserToken(user.id, null, null),
    ]);
  }
}
