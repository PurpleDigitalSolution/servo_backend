import { CreateUserDTO } from "../../interface/user.interface.js";
import { ApiError } from "../../utils/errorHandler.js";
import { AuthRepository } from "./Auth.repo.js";
import bcrypt from "bcrypt";

export class AuthenticationService {
  private static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  static async registerUser(dto: CreateUserDTO) {
    const userExists = await AuthRepository.findUserByEmail(dto.email);
    if (userExists) {
      throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await this.hashPassword(dto.password);

    const createdUser = await AuthRepository.createUserAccount({
      ...dto,
      password: passwordHash,
    });

    return createdUser;
  }
}
