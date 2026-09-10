import { PrismaClient } from "@prisma/client";

console.log(`[PCCP] Prisma DATABASE_URL: ${process.env.DATABASE_URL ? "set" : "NOT SET"}`);

export const prisma = new PrismaClient();
