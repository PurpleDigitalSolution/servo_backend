import { ApiError } from "../../utils/errorHandler.js";
import { TokenRepository } from "./sessionToken.js";
export class TokenService {
  static async isActiveToken(userId: string, sessionId: string) {
    const session = await TokenRepository.findSession(userId, sessionId);
    if (!session) {
      return false;
    }
    return !session.revoked;
  }
  static async invalidateToken(userId: string, sessionId: string) {
    return TokenRepository.markAsRotated(userId, sessionId);
  }
  static async deleteToken(userId: string, sessionId: string) {
    return TokenRepository.deleteSession(userId, sessionId);
  }
  static async deleteAllUserTokens(userId: string) {
    return TokenRepository.deleteAllUserSessions(userId);
  }
  static async rotateSession(userId: string, sessionId: string) {
    const result = await TokenRepository.markAsRotated(userId, sessionId);

    if (result.count !== 1) {
      throw new ApiError(401, "Refresh token has already been used");
    }
  }
  static revokeAllUserSessions(userId: string) {
    return TokenRepository.deleteAllUserSessions(userId);
  }
  static async rotateSessionAtomically(
    userId: string,
    oldSessionId: string,
    newSessionId: string,
  ) {
    return TokenRepository.rotateSessionAtomically(
      userId,
      oldSessionId,
      newSessionId,
    );
  }
}
