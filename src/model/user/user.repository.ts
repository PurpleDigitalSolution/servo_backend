import { prisma } from "../../config/database.js";
import { updateProfileDTO } from "../../interface/user.interface.js";

export interface IUserRepository {
  findCustomersPaginated(skip: number, take: number): Promise<any[]>;
  countUsers(): Promise<number>;
  countCustomers(): Promise<number>;
  countAgents(): Promise<number>;
  findAgentsPaginated(skip: number, take: number): Promise<any[]>;
  countSearchUsers(query: string): Promise<number>;
  searchUser(query: string, skip: number, take: number): Promise<any[]>;
  findUserById(id: string): Promise<any | null>;
  updateProfile(userId: string, profileData: updateProfileDTO): Promise<any>;
  getProfileByUserId(userId: string): Promise<any | null>;
}

export class UserRepository implements IUserRepository {
  private readonly defaultSelect = {
    id: true,
    email: true,
    role: true,
    accountStatus: true,
    userProfile: true,
    createdAt: true,
  };

  private buildSearchWhereClause(query: string) {
    return {
      OR: [
        { email: { contains: query, mode: "insensitive" as const } },
        {
          userProfile: {
            firstName: { contains: query, mode: "insensitive" as const },
          },
        },
        {
          userProfile: {
            lastName: { contains: query, mode: "insensitive" as const },
          },
        },
      ],
    };
  }

  async findCustomersPaginated(skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      where: {
        role: "CUSTOMER",
      },
      select: this.defaultSelect,
    });
  }
  async findAgentsPaginated(skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      where: {
        role: "AGENT",
      },
      select: this.defaultSelect,
    });
  }

  async countUsers() {
    return prisma.user.count();
  }
  async countCustomers() {
    return prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    });
  }
  async countAgents() {
    return prisma.user.count({
      where: {
        role: "AGENT",
      },
    });
  }

  // FIXED: Added count method specifically targeting search sets
  async countSearchUsers(query: string) {
    return prisma.user.count({
      where: this.buildSearchWhereClause(query),
    });
  }

  async searchUser(query: string, skip: number, take: number) {
    return prisma.user.findMany({
      skip,
      take,
      where: this.buildSearchWhereClause(query),
      select: this.defaultSelect,
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: this.defaultSelect,
    });
  }

  async updateProfile(userId: string, profileData: updateProfileDTO) {
    return prisma.userProfile.update({
      where: { userId },
      data: profileData,
    });
  }

  async getProfileByUserId(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: this.defaultSelect,
    });
  }
}
