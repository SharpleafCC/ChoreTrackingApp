// Centralized environment variable loader
// This MUST be imported first in any file that needs environment variables

import { config } from "dotenv";

// Load .env file and override any existing environment variables
const result = config({ override: true });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file:", result.error.message);
} else {
  console.log("✅ Environment variables loaded from .env");
}

// Debug logging for database URL (masked for security)
if (process.env.DATABASE_URL) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
  console.log(`🔗 Database URL from .env: ${maskedUrl}`);
} else {
  console.error("❌ No DATABASE_URL found in environment variables");
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

export {}; // Make this a module
