import { updateProfileDTO } from "../../interface/user.interface.js";
import { ApiError } from "../../utils/errorHandler.js";
import { IUserRepository } from "./user.repository.js";

export class UserService {
  // Inject repository dependency through class constructor
  constructor(private readonly userRepository: IUserRepository) {}

  async getCustomer(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [users, totalCustomers] = await Promise.all([
      this.userRepository.findCustomersPaginated(skip, take),
      this.userRepository.countCustomers(),
    ]);

    return {
      users,
      pagination: {
        totalCustomers,
        totalPages: Math.ceil(totalCustomers / take),
        currentPage: pageNum,
      },
    };
  }
  async getAgents(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [users, totalAgents] = await Promise.all([
      this.userRepository.findAgentsPaginated(skip, take),
      this.userRepository.countAgents(),
    ]);

    return {
      users,
      pagination: {
        totalAgents,
        totalPages: Math.ceil(totalAgents / take),
        currentPage: pageNum,
      },
    };
  }

  async getProfile(userId: string) {
    const result = await this.userRepository.getProfileByUserId(userId);
    if (!result) {
      throw new ApiError(404, "User not found");
    }
    return result;
  }

  async updateProfile(userId: string, dto: updateProfileDTO) {
    const allowedKeys: (keyof updateProfileDTO)[] = [
      "firstName",
      "lastName",
      "phoneNumber",
      "dateOfBirth",
      "address",
    ];

    const cleanDTO = Object.fromEntries(
      Object.entries(dto)
        .filter(([key]) => allowedKeys.includes(key as keyof updateProfileDTO))
        .filter(([_, value]) => {
          if (value === undefined || value === null) return false;
          if (typeof value === "string") {
            return value.trim() !== "";
          }
          return true;
        }),
    ) as updateProfileDTO;

    return await this.userRepository.updateProfile(userId, cleanDTO);
  }

  async searchUsers(query: string, limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    // FIXED: Now accurately counts filtered rows rather than global records
    const [users, totalUsers] = await Promise.all([
      this.userRepository.searchUser(query, skip, take),
      this.userRepository.countSearchUsers(query),
    ]);

    return {
      users,
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / take),
        currentPage: pageNum,
      },
    };
  }
}
