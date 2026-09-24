import { NextFunction, Request, Response, CookieOptions } from "express";
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
import {
  ClientType,
  getClientFromRequest,
  isClientAllowed,
} from "./getClient.js";
import { getSessionToken } from "./getToken.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionPayload & { sessionId: string };
  }
}

type TokenType = "access" | "refresh";

// What actually gets encoded in a signed JWT: the session payload plus
// the session id and an explicit type claim distinguishing access vs
// refresh tokens, so one can never be presented in place of the other.
type SignedTokenPayload = SessionPayload & {
  sessionId: string;
  type: TokenType;
};

export class SessionService {
  /**
   * Centralized cookie-clearing options, shared by every code path that
   * clears session cookies so they can never drift out of sync with the
   * options used when the cookies were originally set.
   */
  private static readonly clearCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };

  /**
   * Decodes a freshly-signed token purely to read back its `exp` claim,
   * so the cookie's maxAge always matches the token's actual lifetime
   * instead of defaulting to a browser-session cookie.
   */
  private static maxAgeMsFromToken(token: string): number | undefined {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return undefined;
    const maxAge = decoded.exp * 1000 - Date.now();
    return maxAge > 0 ? maxAge : undefined;
  }

  /**
   * Centralized helper to attach session cookies to the response.
   */
  private static setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(config.SERVO_SESSION_ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: this.maxAgeMsFromToken(accessToken),
    });

    res.cookie(config.SERVO_SESSION_REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: this.maxAgeMsFromToken(refreshToken),
    });
  }

  /**
   * Helper to create signed JWT access and refresh token pairs. Each is
   * tagged with an explicit `type` claim so a leaked access token can
   * never be replayed as a refresh token (or vice versa) even though
   * both are signed with the same secret and carry the same sessionId.
   */
  private static createTokenPair(
    payload: SessionPayload,
    sessionId: string,
  ): { accessToken: string; refreshToken: string } {
    const accessTokenExpiresIn =
      config.SERVO_SESSION_ACCESS_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"];
    const refreshTokenExpiresIn =
      config.SERVO_SESSION_REFRESH_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"];

    const cleanPayload: SessionPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      client: payload.client,
      mustChangePassword: payload.mustChangePassword,
      accountStatus: payload.accountStatus,
    };

    const accessToken = jwt.sign(
      { ...cleanPayload, sessionId, type: "access" } as SignedTokenPayload,
      config.JWT_SECRET,
      { expiresIn: accessTokenExpiresIn },
    );

    const refreshToken = jwt.sign(
      { ...cleanPayload, sessionId, type: "refresh" } as SignedTokenPayload,
      config.JWT_SECRET,
      { expiresIn: refreshTokenExpiresIn },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verifies a token and asserts it is the expected type (access vs
   * refresh). Throws ApiError(401) on any signature failure, expiry,
   * or type mismatch — callers don't need to distinguish these cases.
   */
  private static verifyTokenOfType(
    token: string,
    expectedType: TokenType,
  ): SignedTokenPayload {
    let decoded: SignedTokenPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as SignedTokenPayload;
    } catch {
      throw new ApiError(
        401,
        `Unauthorized: Invalid or expired ${expectedType} token.`,
      );
    }

    if (decoded.type !== expectedType) {
      throw new ApiError(
        401,
        `Unauthorized: Expected a ${expectedType} token.`,
      );
    }

    return decoded;
  }

  private static async rotateRefreshSession(
    userId: string,
    oldSessionId: string,
    client: ClientType,
    payload: SessionPayload,
  ) {
    if (!isClientAllowed(payload.role, client)) {
      throw new ApiError(
        403,
        `Role ${payload.role} is not allowed to sign in from ${client} client`,
      );
    }
    const newSessionId = crypto.randomUUID();
    const sessionPayloadWithClient = { ...payload, client };

    const { accessToken, refreshToken } = this.createTokenPair(
      sessionPayloadWithClient,
      newSessionId,
    );

    const rotated = await TokenService.rotateSessionAtomically(
      userId,
      oldSessionId,
      newSessionId,
    );

    if (!rotated) {
      throw new ApiError(401, "Session has already been used or revoked.");
    }
    return { accessToken, refreshToken, sessionId: newSessionId };
  }

  /**
   * Shared core for both the middleware auto-refresh path and the
   * explicit /auth/refresh endpoint: verify the refresh token (rejecting
   * anything that isn't actually a refresh token), rotate the session,
   * and set fresh cookies. Keeping this in one place means the
   * access/refresh type check only has to be correct once.
   */
  private static async performRefresh(
    res: Response,
    refreshTokenRaw: string,
    clientOverride?: ClientType,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    decoded: SignedTokenPayload;
  }> {
    const decoded = this.verifyTokenOfType(refreshTokenRaw, "refresh");
    const client = clientOverride || decoded.client;

    const { accessToken, refreshToken } = await this.rotateRefreshSession(
      decoded.userId,
      decoded.sessionId,
      client,
      decoded,
    );

    this.setSessionCookies(res, accessToken, refreshToken);
    return { accessToken, refreshToken, decoded };
  }

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
    const payloadWithClient = { ...payload, client };

    const { accessToken, refreshToken } = this.createTokenPair(
      payloadWithClient,
      sessionId,
    );

    await TokenRepository.saveSession(payload.userId, sessionId);
    this.setSessionCookies(res, accessToken, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Validates refresh token state, rotates session, and issues a fresh session chain.
   * Only ever triggered for WEB clients (matching the TokenExpiredError path in
   * verifySession) — other clients are expected to call /auth/refresh explicitly
   * rather than being silently refreshed by middleware.
   */
  static async autoRefresh(
    req: Request,
    res: Response,
    next: NextFunction,
    client?: ClientType,
  ): Promise<void> {
    const refreshToken =
      req.cookies[config.SERVO_SESSION_REFRESH_TOKEN_NAME] ||
      (req.headers["x-refresh-token"] as string) ||
      getSessionToken(req);

    if (!refreshToken) {
      return next(
        new ApiError(401, "Unauthorized: Session credentials missing"),
      );
    }

    const resolvedClient = client || getClientFromRequest(req);
    if (resolvedClient !== "WEB") {
      return next(
        new ApiError(
          401,
          "Unauthorized: This client must refresh sessions explicitly via /auth/refresh.",
        ),
      );
    }

    try {
      const { accessToken } = await this.performRefresh(
        res,
        refreshToken,
        client,
      );

      req.user = jwt.verify(
        accessToken,
        config.JWT_SECRET,
      ) as SessionPayload & { sessionId: string };

      return next();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return next(error);
      }

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
      (req.headers["x-refresh-token"] as string);

    if (!accessToken && !refreshToken) {
      return next(
        new ApiError(401, "Unauthorized: Missing authentication credentials"),
      );
    }
    if (refreshToken && !accessToken) {
      return await this.autoRefresh(req, res, next);
    }

    try {
      const decoded = this.verifyTokenOfType(accessToken!, "access");

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
      const isExpired =
        error instanceof jwt.TokenExpiredError ||
        (error instanceof ApiError &&
          /expired/i.test(error.message) &&
          // only auto-refresh on an expired *access* token, not a type mismatch
          true);

      if (isExpired && refreshToken) {
        const client = getClientFromRequest(req);
        if (client === "WEB") {
          return this.autoRefresh(req, res, next);
        }
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
  static async refreshSession(req: Request, res: Response) {
    const refreshToken =
      req.cookies[config.SERVO_SESSION_REFRESH_TOKEN_NAME] ||
      getSessionToken(req);

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required.");
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await this.performRefresh(res, refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

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
    } catch (error) {
      // Suppress internal DB errors to ensure cookie cleanup proceeds,
      // but still log so a failing invalidate doesn't vanish silently.
      console.error(
        `[SessionService.clearFrom] Failed to invalidate session ${sessionId} for user ${userId}:`,
        error,
      );
    }

    res.clearCookie(
      config.SERVO_SESSION_ACCESS_TOKEN_NAME,
      this.clearCookieOptions,
    );
    res.clearCookie(
      config.SERVO_SESSION_REFRESH_TOKEN_NAME,
      this.clearCookieOptions,
    );
  }

  static async logout(req: Request, res: Response) {
    const accessToken =
      req.cookies[config.SERVO_SESSION_ACCESS_TOKEN_NAME] ||
      getSessionToken(req);

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          config.JWT_SECRET,
        ) as SignedTokenPayload;

        await TokenService.invalidateToken(decoded.userId, decoded.sessionId);
      } catch {
        /*
         * Even if the access token is expired,
         * cookies should still be cleared.
         */
      }
    }

    res.clearCookie(
      config.SERVO_SESSION_ACCESS_TOKEN_NAME,
      this.clearCookieOptions,
    );
    res.clearCookie(
      config.SERVO_SESSION_REFRESH_TOKEN_NAME,
      this.clearCookieOptions,
    );

    return {
      success: true,
    };
  }
}
