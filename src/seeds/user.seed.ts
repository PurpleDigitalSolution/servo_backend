// src/database/seed.ts
import bcrypt from "bcrypt";
import { AuthRepository } from "../model/Authentication/Auth.repo.js";
import { config } from "../config/config.js";
import { UserRole } from "../types/general.js";

interface SeedUserData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: string;
}

const seedUsers: SeedUserData[] = [
  {
    email: "customer@servo.com",
    password: config.seed.customerPassword!,
    role: "CUSTOMER",
    firstName: "John",
    lastName: "Customer",
    phoneNumber: "08030000001",
    dateOfBirth: new Date("1998-05-10"),
    address: "12 Customer Street, Kano",
  },
  {
    email: "agent@servo.com",
    password: config.seed.agentPassword!,
    role: "AGENT",
    firstName: "David",
    lastName: "Agent",
    phoneNumber: "08030000002",
    dateOfBirth: new Date("1994-09-18"),
    address: "24 Agent Close, Kano",
  },
];

const authRepository = new AuthRepository();

export const seedUsersData = async (): Promise<void> => {
  console.log("🚀 Starting database seeding...");

  await Promise.all(
    seedUsers.map(async (user) => {
      try {
        const existingUser = await authRepository.findUserByEmail(user.email);

        if (existingUser) {
          console.log(
            `ℹ️ ${user.role} (${user.email}) already exists. Skipping.`,
          );
          return;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await authRepository.createUserAccount({
          ...user,
          password: hashedPassword,
        });

        console.log(`✅ ${user.role} (${user.email}) seeded successfully.`);
      } catch (error) {
        console.error(`❌ Failed to seed ${user.email}:`, error);
      }
    }),
  );

  console.log("🏁 Database seeding complete.");
};
