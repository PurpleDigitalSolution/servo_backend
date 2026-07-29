import { UserRole } from "../types/general.js";

export interface CreateUserDTO {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: string;
  mustAddPassword?: boolean; // Optional field to indicate if the user must add a password
}
export interface userWithoutPassword {
  id: string;
  email: string;
  role: string;
  accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
  userProfile: {
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: Date;
    address: string;
  } | null;
  createdAt: Date;
}
export interface updateProfileDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
}
