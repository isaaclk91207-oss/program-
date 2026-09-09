import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const datasourceUrl = `file:${dbPath}`;

console.log(`[PCCP] Prisma connecting to: ${datasourceUrl}`);

export const prisma = new PrismaClient({ datasourceUrl });
