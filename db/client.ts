import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./difficult-schema";
import { getDatabaseUrl } from "./url";

const databaseGlobal = globalThis as unknown as { difficultPool?: pg.Pool };

export function getDatabase() {
  databaseGlobal.difficultPool ??= new pg.Pool({
    connectionString: getDatabaseUrl(), max: 5,
    idleTimeoutMillis: 20_000, connectionTimeoutMillis: 15_000,
  });
  return drizzle(databaseGlobal.difficultPool, { schema });
}
