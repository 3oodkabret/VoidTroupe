import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function normalizeDatabaseUrl(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function getPoolConfig(rawUrl: string) {
  const normalized = normalizeDatabaseUrl(rawUrl);
  let connectionString = normalized;
  let hostname = "";

  try {
    const parsed = new URL(normalized);
    hostname = parsed.hostname;
    // pg treats sslmode=require as strict TLS verification, which breaks Supabase pooler on Render.
    parsed.searchParams.delete("sslmode");
    connectionString = parsed.toString();
  } catch {
    // Keep the raw string if it is not a standard URL.
  }

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    connectionString.includes("@localhost") ||
    connectionString.includes("@127.0.0.1");

  return {
    connectionString,
    ssl: isLocal
      ? undefined
      : {
          rejectUnauthorized: false,
        },
    connectionTimeoutMillis: 10_000,
  };
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig = getPoolConfig(process.env.DATABASE_URL);
export const connectionString = poolConfig.connectionString;
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export type DatabasePingResult =
  | { ok: true }
  | { ok: false; code?: string; message: string; hints: string[] };

export function getDatabaseConnectionHints(url: string): string[] {
  const hints: string[] = [];

  if (url.includes("[YOUR-PASSWORD]") || url.includes("[YOUR_PASSWORD]")) {
    hints.push("Replace [YOUR-PASSWORD] with your real Supabase database password.");
  }

  if (/^["']|["']$/.test(process.env.DATABASE_URL?.trim() ?? "")) {
    hints.push("Remove surrounding quotes from DATABASE_URL on Render.");
  }

  if (url.includes("@db.") && url.includes(".supabase.co") && !url.includes("pooler")) {
    hints.push("Use Supabase Session pooler on Render (Direct connection is IPv6-only).");
  }

  if (url.includes("pooler.supabase.com") && url.includes("postgres@") && !url.includes("postgres.")) {
    hints.push("Pooler username should be postgres.<project-ref>, not postgres.");
  }

  return hints;
}

export async function pingDatabase(): Promise<DatabasePingResult> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { ok: true };
    } finally {
      client.release();
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return {
      ok: false,
      code: err.code,
      message: err.message || "Unknown database error",
      hints: getDatabaseConnectionHints(connectionString),
    };
  }
}

export * from "./schema";
