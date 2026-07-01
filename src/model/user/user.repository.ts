import { prisma } from "../../config/database.js";
import { updateProfileDTO } from "../../interface/user.interface.js";

export class UserRepository {
  static async findUsersPaginated(skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        userProfile: true,
        createdAt: true,
      },
    });
  }
  static async countUsers() {
    return prisma.user.count();
  }
  static async searchUser(query: string, skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          {
            userProfile: {
              firstName: { contains: query, mode: "insensitive" },
            },
          },
          {
            userProfile: { lastName: { contains: query, mode: "insensitive" } },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        userProfile: true,
        createdAt: true,
      },
    });
  }
  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        userProfile: true,
        createdAt: true,
      },
    });
  }
  static async updateProfile(userId: string, profileData: updateProfileDTO) {
    return prisma.userProfile.update({
      where: { userId },
      data: profileData,
    });
  }
  static async getProfileByUserId(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
    });
  }
}
