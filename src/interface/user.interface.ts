import { AccountStatus, UserRole, workStatus } from "../types/general.js";

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
  role: UserRole;
  stationId?: string;
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

export interface IAgent {
  id: string;
  email: string;
  role: UserRole;
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
  stationId: string | null;
  workStatus: workStatus | null;
}

export interface updateProfileDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
}
export interface UpdateAccountStatusDTO {
  userId: string;
  adminId?: string;
  status: AccountStatus;
  metaData?: {
    reason: string;
  };
}
