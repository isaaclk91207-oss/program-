import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;

console.log(`[PCCP] Prisma DATABASE_URL: ${process.env.DATABASE_URL}`);

export const prisma = new PrismaClient();
