import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const databaseDir = path.join(rootDir, ".pgdata");
const port = Number(process.env.PGPORT ?? 5432);
const password = process.env.PGPASSWORD ?? "postgres";
const database = process.env.PGDATABASE ?? "void_troupe";

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password,
  port,
  persistent: true,
});

await pg.initialise();
await pg.start();

const client = pg.getPgClient();
await client.connect();

const exists = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  [database],
);

if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE ${database}`);
  console.log(`Created database "${database}"`);
}

await client.end();

console.log(
  `Embedded PostgreSQL running on port ${port} (data: ${databaseDir})`,
);
console.log(
  `DATABASE_URL=postgresql://postgres:${password}@localhost:${port}/${database}`,
);

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});
