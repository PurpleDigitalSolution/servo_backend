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
import config from "../../config/config.js";
import { TokenService } from "../token/token.service.js";
import { ClientType } from "../../utils/getClient.js";

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<any | null>;
  findUserByPhone(phoneNumber: string): Promise<any | null>;
  findUserByEmailForOtp(email: string): Promise<any | null>;
  findUserById(id: string): Promise<any | null>;
  findUserByToken(token: string): Promise<any | null>;
  createUserAccount(dto: CreateUserDTO): Promise<any>;
  updatePasswordAndClearFlag(
    userId: string,
    hashedPassword: string,
  ): Promise<any>;
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
    private readonly sessionService: typeof SessionService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(
    plainText: string,
    hashed: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainText, hashed);
  }

  /**
   * Fast, secure hash function for short-lived OTP verification.
   * Prevents CPU-exhaustion DoS attacks while keeping database leaks safe.
   */
  private hashOtp(otp: string): string {
    return crypto
      .createHmac("sha256", config.OTP_HMAC_SECRET || "fallback_secret")
      .update(otp)
      .digest("hex");
  }

  async registerUser(dto: CreateUserDTO): Promise<any> {
    const userExists = await this.authRepository.findUserByEmail(dto.email);
    const userPhoneNumberExists = await this.authRepository.findUserByPhone(
      dto.phoneNumber,
    );
    if (userExists) {
      throw new ApiError(409, "User with this email already exists");
    }
    if (userPhoneNumberExists) {
      throw new ApiError(409, "User with this phone number already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);
    return await this.authRepository.createUserAccount({
      ...dto,
      password: passwordHash,
    });
  }

  async registerAgent(dto: Omit<CreateUserDTO, "password">): Promise<any> {
    const userExists = await this.authRepository.findUserByEmail(dto.email);
    if (userExists) {
      throw new ApiError(409, "Agent with this email already exists");
    }
    const userPhoneNumberExists = await this.authRepository.findUserByPhone(
      dto.phoneNumber,
    );
    if (userPhoneNumberExists) {
      throw new ApiError(409, "Agent with this phone number already exists");
    }
    const defaultPassword = config.DEFAULT_AGENT_PASSWORD || "Agent@123";
    const passwordHash = await this.hashPassword(defaultPassword);

    return await this.authRepository.createUserAccount({
      ...dto,
      mustAddPassword: true,
      password: passwordHash,
    });
  }

  async login(email: string, password: string): Promise<userWithoutPassword> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(400, "Invalid email or password");
    }

    const isPasswordValid = await this.comparePassword(
      password,
      user.password || user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid email or password");
    }

    const { password: _p, passwordHash: _ph, ...userWithoutPassword } = user;
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

    const { password: _p, passwordHash: _ph, ...userWithoutPassword } = user;
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

    if (!user.otp || !user.otpExpiry) {
      throw new ApiError(400, "No active verification requests found");
    }

    if (user.otpExpiry < new Date()) {
      await this.authRepository.updateUserOtp(user.id, null, null);
      throw new ApiError(400, "OTP has expired");
    }

    const secureIncomingOtp = this.hashOtp(otp);
    const isOtpValid = crypto.timingSafeEqual(
      Buffer.from(secureIncomingOtp, "utf-8"),
      Buffer.from(user.otp, "utf-8"),
    );

    if (!isOtpValid) {
      throw new ApiError(400, "Invalid OTP");
    }

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

    await Promise.all([
      this.authRepository.updateUserPassword(user.id, hashedPassword),
      this.authRepository.updateUserToken(user.id, null, null),
      TokenService.revokeAllUserSessions(user.id), // 👈 Revoke sessions after reset
    ]);
  }

  async changeDefaultPassword(
    userId: string,
    newPassword: string,
    res: Response,
    client: ClientType,
  ): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const currentHashedPassword = user.password || user.passwordHash;

    // 1. Guard: Ensure new password isn't identical to the existing default password
    const isSamePassword = await this.comparePassword(
      newPassword,
      currentHashedPassword,
    );
    if (isSamePassword) {
      throw new ApiError(
        400,
        "New password cannot be the same as your default password",
      );
    }

    // 2. Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    // 3. Update password in DB & set mustChangePassword to false
    await this.authRepository.updatePasswordAndClearFlag(
      userId,
      hashedPassword,
    );

    // 4. Invalidate all existing active sessions
    await TokenService.revokeAllUserSessions(userId);

    // 5. Issue a fresh session token with `mustChangePassword: false`
    const updatedUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      mustChangePassword: false,
      client: client,
    };

    await SessionService.signTo(res, updatedUserPayload, client);
  }
  async changePassword(
    userId: string,
    currentPassword?: string,
    newPassword?: string,
  ): Promise<void> {
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    if (!currentPassword || !newPassword) {
      throw new ApiError(
        400,
        "Both current password and new password are required",
      );
    }

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const userPasswordHash = user.password || user.passwordHash;
    const isCurrentPasswordValid = await this.comparePassword(
      currentPassword,
      userPasswordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, "Incorrect current password");
    }

    const isSamePassword = await this.comparePassword(
      newPassword,
      userPasswordHash,
    );
    if (isSamePassword) {
      throw new ApiError(
        400,
        "New password cannot be identical to your current password",
      );
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.authRepository.updateUserPassword(user.id, hashedPassword);

    await TokenService.revokeAllUserSessions(user.id);
  }
}
