import { updateProfileDTO } from "../../interface/user.interface.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
  static async getUsers(limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [users, totalUsers] = await Promise.all([
      UserRepository.findUsersPaginated(skip, take),
      UserRepository.countUsers(),
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
  static async getProfile(userId: string) {
    return await UserRepository.getProfileByUserId(userId);
  }
  static async updateProfile(userId: string, dto: updateProfileDTO) {
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

    return await UserRepository.updateProfile(userId, cleanDTO);
  }
  static async searchUsers(query: string, limit: string, page: string) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const pageNum = Math.max(1, Number(page) || 1);
    const skip = (pageNum - 1) * take;

    const [users, totalUsers] = await Promise.all([
      UserRepository.searchUser(query, skip, take),
      UserRepository.countUsers(),
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
