#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

console.log("[ensure-db] Deploying migrations to PostgreSQL...");

try {
  execSync("npx prisma migrate deploy", {
    cwd: rootDir,
    stdio: "inherit",
    timeout: 60000,
  });
  console.log("[ensure-db] Migrations deployed successfully.");
} catch (err) {
  console.error("[ensure-db] prisma migrate deploy failed:", err.message);
  process.exit(1);
}
