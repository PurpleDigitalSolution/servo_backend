import { prisma } from "../../config/database.js";
export class TokenRepository {
  static saveSession(userId: string, sessionId: string) {
    return prisma.sessionToken.create({
      data: {
        sessionTokenId: sessionId,
        userId,
      },
    });
  }
  static findSession(userId: string, sessionId: string) {
    return prisma.sessionToken.findFirst({
      where: {
        userId,
        sessionTokenId: sessionId,
      },
    });
  }
  static markAsRotated(userId: string, sessionId: string) {
    return prisma.sessionToken.updateMany({
      where: {
        userId,
        sessionTokenId: sessionId,
      },
      data: {
        revoked: true,
        usedAt: new Date(),
      },
    });
  }
  static deleteSession(userId: string, sessionId: string) {
    return prisma.sessionToken.deleteMany({
      where: {
        userId,
        sessionTokenId: sessionId,
      },
    });
  }
  static deleteAllUserSessions(userId: string) {
    return prisma.sessionToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}
