// Simple script to check environment variables
import { config } from "dotenv";

console.log("🔍 Environment Variable Debug");
console.log("============================");

console.log("Before loading .env:");
console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
  console.log(`Current DATABASE_URL: ${masked}`);
}

// Force load .env with override
config({ override: true });

console.log("\nAfter loading .env with override:");
console.log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
  console.log(`Current DATABASE_URL: ${masked}`);
}

console.log("\nAll environment variables starting with DATABASE:");
Object.keys(process.env)
  .filter((key) => key.startsWith("DATABASE"))
  .forEach((key) => {
    const value = process.env[key];
    const masked =
      value && value.includes("@")
        ? value.replace(/:[^:@]*@/, ":****@")
        : value;
    console.log(`${key}: ${masked}`);
  });
