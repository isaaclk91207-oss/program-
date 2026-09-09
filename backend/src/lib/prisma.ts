import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbPath}`;

process.env.DATABASE_URL = dbUrl;

console.log(`[PCCP] Database path: ${dbPath}`);
console.log(`[PCCP] DATABASE_URL: ${dbUrl}`);

export const prisma = new PrismaClient({ datasourceUrl: dbUrl });
