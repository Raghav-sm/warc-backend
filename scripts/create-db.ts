import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const url = new URL(databaseUrl);
const dbName = url.pathname.replace(/^\//, "");

if (!dbName) {
  console.error("DATABASE_URL must include a database name");
  process.exit(1);
}

url.pathname = "/postgres";

async function createDatabase() {
  const client = new Client({ connectionString: url.toString() });
  await client.connect();

  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`Database "${dbName}" already exists`);
      return;
    }

    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created`);
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error("Failed to create database:", error);
  process.exit(1);
});
