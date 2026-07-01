import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
const adminDbPool = new Pool({
  port: parseInt(process.env.DB_PORT || "5432"),
  host: process.env.DB_HOST || "localhost",
  database: "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

export const createDatabase = async () => {
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error("DB_NAME environment variable is not set.");
  }
  try {
    const client = await adminDbPool.connect();
    const checkDbExistsQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await client.query(checkDbExistsQuery, [dbName]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully.`);
      console.log(
        `🌐 Database URL: postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`,
      );
    } else {
      console.log(`ℹ️ Database ${dbName} already exists.`);
    }
    client.release();
  } catch (error) {
    console.error(`❌ Error creating database ${dbName}:`, error);
  }
};

createDatabase();
