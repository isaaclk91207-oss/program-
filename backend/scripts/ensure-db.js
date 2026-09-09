#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(rootDir, "prisma", "dev.db");

// Set DATABASE_URL to absolute path so both CLI and PrismaClient use the same file
process.env.DATABASE_URL = "file:" + dbPath;

console.log("[ensure-db] Syncing database schema...");
console.log("[ensure-db] DATABASE_URL:", process.env.DATABASE_URL);
console.log("[ensure-db] Database file:", dbPath);

try {
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    cwd: rootDir,
    stdio: "inherit",
    timeout: 30000,
    env: { ...process.env, DATABASE_URL: "file:" + dbPath },
  });
  console.log("[ensure-db] Schema synced successfully.");
} catch (err) {
  console.error("[ensure-db] prisma db push failed:", err.message);
  process.exit(1);
}
