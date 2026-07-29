// src/database/seed.ts
import { AuthRepository } from "../model/Authentication/Auth.repo.js";

import bcrypt from "bcrypt";
import { UserRole } from "../types/general.js";
import { config } from "../config/config.js";

interface AdminSeedData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: string;
}

const adminUsers: AdminSeedData[] = [
  {
    email: "admin@servo.com",
    password: config.seed.adminPassword,
    role: "ADMIN",
    firstName: "Admin",
    lastName: "User",
    phoneNumber: "1234567890",
    dateOfBirth: new Date("1990-01-01"),
    address: "123 Admin St",
  },
  {
    email: "superadmin@servo.com",
    password: config.seed.superAdminPassword,
    role: "SUPER_ADMIN",
    firstName: "Super",
    lastName: "Admin",
    phoneNumber: "0987654321",
    dateOfBirth: new Date("1985-01-01"),
    address: "456 Super Admin Ave",
  },
];
const authRepository = new AuthRepository();
export const seedAdminUser = async (): Promise<void> => {
  console.log("🚀 Starting database seeding sequence...");

  const seedingPromises = adminUsers.map(async (admin) => {
    try {
      const existingUser = await authRepository.findUserByEmail(admin.email);

      if (existingUser) {
        console.log(`ℹ️ Admin user ${admin.email} already exists. Skipping.`);
        return;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await authRepository.createUserAccount({
        ...admin,
        mustAddPassword: true,
        password: hashedPassword,
      });

      console.log(
        `✅ Admin user ${admin.email} [${admin.role}] seeded successfully.`,
      );
    } catch (error) {
      console.error(`❌ Failed to seed admin user ${admin.email}:`, error);
    }
  });

  await Promise.all(seedingPromises);
  console.log("🏁 Admin seeding sequence complete.");
};
