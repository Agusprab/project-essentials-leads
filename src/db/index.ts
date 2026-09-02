import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { appTimeZone } from "@/lib/datetime/timezone";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum dikonfigurasi");
}

const globalForDatabase = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDatabase.postgresClient ??
  postgres(process.env.DATABASE_URL, {
    max: 5,
    connection: {
      TimeZone: appTimeZone,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = client;
}

export const db = drizzle(client, {
  schema,
});
