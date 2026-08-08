import { NextFunction, Request, Response } from "express";
import {
  jwtSignReturnType,
  SessionPayload,
} from "../interface/session.interface.js";
import crypto from "crypto";
import { config } from "../config/config.js";
import jwt from "jsonwebtoken";
import { TokenRepository } from "../model/token/sessionToken.js";
import { TokenService } from "../model/token/token.service.js";
import { ApiError } from "../utils/errorHandler.js";
import { ClientType, isClientAllowed } from "./getClient.js";
import { getSessionToken } from "./getToken.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload & { sessionId: string };
  }
}

export class SessionService {
  /**
   * Generates new Access & Refresh tokens, registers session state, and attaches cookies.
   */
  static async signTo(
    res: Response,
    payload: SessionPayload,
    client: ClientType,
  ): Promise<jwtSignReturnType> {
    if (!isClientAllowed(payload.role, client)) {
      throw new ApiError(
        403,
        `Role ${payload.role} is not allowed to sign in from ${client} client`,
      );
    }
    const sessionId = crypto.randomUUID();

    const accessTokenExpiresIn =
      config.SERVO_SESSION_ACCESS_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"];
    const refreshTokenExpiresIn =
      config.SERVO_SESSION_REFRESH_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"];

    // Explicitly destructure payload to drop any accidental 'iat' or 'exp' properties from old tokens
    const cleanPayload: SessionPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      client: client,
      mustChangePassword: payload.mustChangePassword,
      accountStatus: payload.accountStatus,
    };

    const payloadWithSessionId = { ...cleanPayload, sessionId };

    const accessToken = jwt.sign(payloadWithSessionId, config.JWT_SECRET, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = jwt.sign(payloadWithSessionId, config.JWT_SECRET, {
      expiresIn: refreshTokenExpiresIn,
    });

    await TokenRepository.saveSession(payload.userId, sessionId);

    const cookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    res.cookie(
      config.SERVO_SESSION_ACCESS_TOKEN_NAME,
      accessToken,
      cookieOptions,
    );
    res.cookie(
      config.SERVO_SESSION_REFRESH_TOKEN_NAME,
      refreshToken,
      cookieOptions,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Validates refresh token state, rotates session, and issues a fresh session chain.
   */
  static async autoRefresh(
    req: Request,
    res: Response,
    next: NextFunction,
    client?: ClientType,
  ): Promise<void> {
    const refreshToken =
      req.cookies[config.SERVO_SESSION_REFRESH_TOKEN_NAME] ||
      getSessionToken(req);

    if (!refreshToken) {
      return next(
        new ApiError(401, "Unauthorized: Session credentials missing"),
      );
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_SECRET,
      ) as SessionPayload & { sessionId: string };

      const isActive = await TokenService.isActiveToken(
        decoded.userId,
        decoded.sessionId,
      );

      if (!isActive) {
        await this.clearFrom(res, decoded.userId, decoded.sessionId);
        return next(new ApiError(401, "Session expired. Please login again."));
      }

      const decodedClient = client || decoded.client;

      // 1. Invalidate old session in storage
      await TokenService.rotateSession(decoded.userId, decoded.sessionId);

      // 2. Issue single new session chain
      const { accessToken } = await this.signTo(res, decoded, decodedClient);

      // 3. Attach fresh session payload to request
      req.user = jwt.verify(
        accessToken,
        config.JWT_SECRET,
      ) as SessionPayload & { sessionId: string };

      return next();
    } catch (error: unknown) {
      console.log("SessionService.autoRefresh error:", error);
      return next(
        new ApiError(401, "Unauthorized: Invalid or expired refresh token."),
      );
    }
  }

  /**
   * Verifies access token and falls back to autoRefresh if expired.
   */
  static async verifySession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const accessToken =
      req.cookies[config.SERVO_SESSION_ACCESS_TOKEN_NAME] ||
      getSessionToken(req);

    const refreshToken =
      req.cookies[config.SERVO_SESSION_REFRESH_TOKEN_NAME] ||
      req.headers["x-refresh-token"]; // Added header support for non-cookie clients

    if (!accessToken && !refreshToken) {
      return next(
        new ApiError(401, "Unauthorized: Missing authentication credentials"),
      );
    }

    try {
      if (refreshToken && !accessToken) {
        return await this.autoRefresh(req, res, next);
      }

      const decoded = jwt.verify(
        accessToken!,
        config.JWT_SECRET,
      ) as SessionPayload & { sessionId: string };

      const isActive = await TokenService.isActiveToken(
        decoded.userId,
        decoded.sessionId,
      );

      if (!isActive) {
        await this.clearFrom(res, decoded.userId, decoded.sessionId);
        return next(new ApiError(403, "Session invalid or revoked."));
      }

      req.user = decoded;
      return next();
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError && refreshToken) {
        return this.autoRefresh(req, res, next);
      }
      return next(
        new ApiError(
          401,
          "Unauthorized: Invalid or expired token access credentials.",
        ),
      );
    }
  }

  /**
   * Manual refresh endpoint handler (includes strict token rotation).
   */
  static async refreshSession(
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken =
      req.cookies[config.SERVO_SESSION_REFRESH_TOKEN_NAME] ||
      getSessionToken(req);

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized: Missing refresh token");
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_SECRET,
      ) as SessionPayload & { sessionId: string };

      const isActive = await TokenService.isActiveToken(
        decoded.userId,
        decoded.sessionId,
      );

      if (!isActive) {
        await this.clearFrom(res, decoded.userId, decoded.sessionId);
        throw new ApiError(403, "Session invalid or revoked.");
      }

      // Rotate session before signing a new one
      await TokenService.rotateSession(decoded.userId, decoded.sessionId);

      return this.signTo(res, decoded, decoded.client);
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      console.log("SessionService.refreshSession error:", error);
      throw new ApiError(
        401,
        "Unauthorized: Invalid or expired refresh token.",
      );
    }
  }

  static async clearFrom(
    res: Response,
    userId: string,
    sessionId: string,
  ): Promise<void> {
    try {
      await TokenService.invalidateToken(userId, sessionId);
    } catch {
      // Suppress or log internal database errors to guarantee cookie clearing executes
    }

    const clearOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    res.clearCookie(config.SERVO_SESSION_ACCESS_TOKEN_NAME, clearOptions);
    res.clearCookie(config.SERVO_SESSION_REFRESH_TOKEN_NAME, clearOptions);
  }
}
