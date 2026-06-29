import { UserType } from "../types/general.js";

export interface CreateUserDTO {
  email: string;
  password: string;
  role: UserType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: string;
}
