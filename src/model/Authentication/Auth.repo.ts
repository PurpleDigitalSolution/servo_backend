import { prisma } from "../../config/database.js";
import { CreateUserDTO } from "../../interface/user.interface.js";
import { AccountStatus, PrismaTx } from "../../types/general.js";
import { IAuthRepository } from "./Auth.service.js";

// Note: To prevent circular dependencies, define the contract interface either here
// or in a dedicated interface directory. We implement the interface to ensure
// it adheres strictly to the shape expected by our AuthenticationService.
export class AuthRepository implements IAuthRepository {
  private readonly prismaClient = prisma;

  // Consistently select the same payload structure for clean mapping operations
  private readonly defaultUserSelect = {
    id: true,
    stationId: true,
    email: true,
    role: true,
    accountStatus: true,
    userProfile: true,
    mustChangePassword: true,
    createdAt: true,
  };

  async createUserAccount(dto: CreateUserDTO): Promise<any> {
    return await this.prismaClient.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash: dto.password,
        role: dto.role,
        mustChangePassword: dto.mustAddPassword,
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
      select: this.defaultUserSelect,
    });
  }
  async findUserByPhone(phoneNumber: string): Promise<any | null> {
    return await this.prismaClient.user.findFirst({
      where: { userProfile: { phoneNumber } },
      select: this.defaultUserSelect,
    });
  }
  async findUserByEmail(email: string): Promise<any | null> {
    return await this.prismaClient.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        ...this.defaultUserSelect,
        passwordHash: true, // Needed for bcrypt comparisons during login
      },
    });
  }

  async findUserByEmailForOtp(email: string): Promise<any | null> {
    return await this.prismaClient.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        email: true,
        id: true,
        otp: true,
        otpExpiry: true,
        userProfile: { select: { firstName: true } },
      },
    });
  }

  async findUserById(id: string): Promise<any | null> {
    return await this.prismaClient.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
      },
    });
  }

  async updateUserPassword(id: string, newPassword: string): Promise<void> {
    await this.prismaClient.user.update({
      where: { id },
      data: { passwordHash: newPassword },
    });
  }

  async updateUserAccountStatus(
    id: string,
    newStatus: AccountStatus,
  ): Promise<void> {
    await this.prismaClient.user.update({
      where: { id },
      data: { accountStatus: newStatus },
    });
  }

  async updateUserVerificationStatus(
    id: string,
    newStatus: "PENDING" | "VERIFIED",
  ): Promise<void> {
    await this.prismaClient.user.update({
      where: { id },
      data: { verificationStatus: newStatus },
    });
  }

  async updateUserToken(
    id: string,
    token: string | null,
    tokenExpiry: Date | null,
  ): Promise<void> {
    await this.prismaClient.user.update({
      where: { id },
      data: { token, tokenExpiry },
    });
  }

  async updateUserOtp(
    id: string,
    otp: string | null,
    otpExpiry: Date | null,
  ): Promise<void> {
    await this.prismaClient.user.update({
      where: { id },
      data: { otp, otpExpiry },
    });
  }

  async findUserByToken(token: string): Promise<any | null> {
    return await this.prismaClient.user.findFirst({
      where: { token },
      select: {
        id: true,
        email: true,
        tokenExpiry: true, // Added tokenExpiry to support expirations check in service
      },
    });
  }
  async updatePasswordAndClearFlag(userId: string, hashedPassword: string) {
    return await this.prismaClient.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });
  }
  async updateAccountStatus(
    userId: string,
    status: AccountStatus,
    suspensionData?: {
      reason?: string;
      suspendedAt?: Date | null;
      suspendedById?: string | null;
    },
    tx: PrismaTx = this.prismaClient,
  ): Promise<any> {
    const isSuspended = status === "SUSPENDED" || status === "BANNED";

    return await tx.user.update({
      where: { id: userId },
      data: {
        accountStatus: status,
        suspensionReason: isSuspended ? suspensionData?.reason : null,
        suspendedAt: isSuspended
          ? (suspensionData?.suspendedAt ?? new Date())
          : null,
        suspendedById: isSuspended ? suspensionData?.suspendedById : null,
        // If reactivating an account, reset workStatus/tokens if applicable
        ...(status === "ACTIVE" && { workStatus: "AVAILABLE" }),
      },
      select: this.defaultUserSelect,
    });
  }
}
