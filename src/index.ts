import app from "./app.js";
import config from "./config/config.js";
import { prisma } from "./config/database.js";
import { assignPendingOrder } from "./job/order.job.js";

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  const PORT = config.PORT;
  try {
    await prisma.$connect();
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}/api/v1/health`);
    });
    console.log("loading cron jobs");
    assignPendingOrder();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Process Error Handlers
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(reason);

  if (server) {
    server.close(async () => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      // await prisma.$disconnect();
      console.log("Server and database disconnected");
      process.exit(0);
    });
  } else {
    // await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
