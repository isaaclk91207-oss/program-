import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;
console.log(`[PCCP] DATABASE_URL resolved to: ${process.env.DATABASE_URL}`);
