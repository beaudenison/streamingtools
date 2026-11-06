import { readFileSync } from "fs";
import path from "path";
import postgres from "postgres";

const schema = readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;
let ready: Promise<void> | null = null;

export function databaseUrl() {
  return process.env.DATABASE_URL || "";
}

export async function db() {
  if (!databaseUrl()) return null;
  if (!client) {
    client = postgres(databaseUrl(), {
      max: 1,
      prepare: false,
      idle_timeout: 20,
    });
  }
  if (!ready) {
    const current = client;
    ready = current.unsafe(schema).then(() => undefined).catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
  return client;
}
