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
    if (typeof TokenRepository.markAsRotated === "function") {
      await TokenRepository.markAsRotated(userId, sessionId);
    } else {
      await TokenRepository.deleteSession(userId, sessionId);
    }
  }
  static revokeAllUserSessions(userId: string) {
    return TokenRepository.deleteAllUserSessions(userId);
  }
}
