import { prisma } from "../config/database.js";
import { seedAdminUser } from "./admin.seed.js";

const runSeeds = async (): Promise<void> => {
  try {
    console.log("⏳ Initializing primary database seed orchestration...");

    await Promise.all([seedAdminUser()]);

    console.log("🎉 All seeds executed and finalized without errors.");
    process.exit(0);
  } catch (err) {
    console.error(
      "💥 Critical error encountered during global seeding sequence:",
      err,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

runSeeds();
