import { prisma } from "../../config/database.js";
import { CreateUserDTO } from "../../interface/user.interface.js";
import { AccountStatus } from "../../types/general.js";

export class AuthRepository {
  static async createUserAccount(dto: CreateUserDTO) {
    return await prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash: dto.password,
        role: dto.role,
        userProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phoneNumber: dto.phoneNumber,
            dateOfBirth: new Date(dto.dateOfBirth),
            address: dto.address,
          },
        },
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
  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        passwordHash: true,
        userProfile: true,
        createdAt: true,
      },
    });
  }
  static async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
      },
    });
  }
  static async updateUserPassword(id: string, newPassword: string) {
    return await prisma.user.update({
      where: { id },
      data: { passwordHash: newPassword },
    });
  }
  static async updateUserAccountStatus(id: string, newStatus: AccountStatus) {
    return await prisma.user.update({
      where: { id },
      data: { accountStatus: newStatus },
    });
  }
}
