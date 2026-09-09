import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COLUMNS_TO_ENSURE: { table: string; column: string; definition: string }[] = [
  { table: "transport_requests", column: "pickedUpAt", definition: "TEXT" },
  { table: "transport_requests", column: "droppedOffAt", definition: "TEXT" },
  { table: "transport_requests", column: "noOfPeople", definition: "INTEGER" },
  { table: "transport_requests", column: "wayUsers", definition: "TEXT" },
  { table: "transport_requests", column: "section", definition: "TEXT" },
  { table: "transport_requests", column: "serviceType", definition: "TEXT" },
  { table: "transport_requests", column: "purpose", definition: "TEXT" },
  { table: "transport_requests", column: "returnTime", definition: "TEXT" },
  { table: "transport_requests", column: "note", definition: "TEXT" },
];

export async function ensureSchema(): Promise<void> {
  for (const { table, column, definition } of COLUMNS_TO_ENSURE) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
      );
      console.log(`[PCCP] Added column ${table}.${column}`);
    } catch (err: any) {
      if (err?.code === "SQLITE_ERROR" && err?.message?.includes("duplicate column")) {
        // column already exists, ignore
      } else {
        console.error(`[PCCP] Failed to add column ${table}.${column}:`, err.message);
      }
    }
  }
  await prisma.$disconnect();
}
