import {
  CreateUserDTO,
  userWithoutPassword,
} from "../../interface/user.interface.js";
import { ApiError } from "../../utils/errorHandler.js";
import { SessionService } from "../../utils/Session.js";
import { AuthRepository } from "./Auth.repo.js";
import { Response, Request } from "express";
import bcrypt from "bcrypt";

export class AuthenticationService {
  private static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  static async registerUser(dto: CreateUserDTO) {
    const userExists = await AuthRepository.findUserByEmail(dto.email);
    if (userExists) {
      throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);

    const createdUser = await AuthRepository.createUserAccount({
      ...dto,
      password: passwordHash,
    });

    return createdUser;
  }
  static async login(
    email: string,
    password: string,
  ): Promise<userWithoutPassword> {
    const user = await AuthRepository.findUserByEmail(email);
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
  static async logout(res: Response, req: Request) {
    if (!req.user) {
      throw new ApiError(401, "No active session found");
    }

    const { userId, sessionId } = req.user;
    if (!sessionId) {
      throw new ApiError(400, "Session ID missing from token status");
    }

    await SessionService.clearFrom(res, userId, sessionId);
  }
  static async getAuthenticatedUser(
    req: Request,
  ): Promise<userWithoutPassword> {
    if (!req.user) {
      throw new ApiError(401, "No active session found");
    }

    const { userId } = req.user;
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
