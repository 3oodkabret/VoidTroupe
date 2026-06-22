import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const needsSsl =
  connectionString.includes("supabase.co") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("sslmode=require");

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export async function pingDatabase(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}

export * from "./schema";
