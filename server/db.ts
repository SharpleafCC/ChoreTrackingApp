// Load environment variables FIRST, before any other operations
import { config } from "dotenv";
config({ override: true });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Debug: Log which database we're connecting to (hide credentials for security)
const dbUrl = process.env.DATABASE_URL;
const maskedUrl = dbUrl.replace(/:[^:@]*@/, ":****@");
console.log(`🔗 Connecting to database: ${maskedUrl}`);

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
