import { prisma } from "./lib/prisma";

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
  { table: "vehicles", column: "gpsDeviceId", definition: "INTEGER" },
];

export async function ensureSchema(): Promise<void> {
  try {
    console.log("[PCCP] ensureSchema: checking database columns...");

    for (const { table, column, definition } of COLUMNS_TO_ENSURE) {
      const existing = await prisma.$queryRawUnsafe<{ name: string }[]>(
        `PRAGMA table_info(${table})`
      );
      const existingCols = new Set(existing.map((c) => c.name));
      if (existingCols.has(column)) {
        continue;
      }
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
        );
        console.log(`[PCCP] ensureSchema: added ${table}.${column}`);
      } catch (err: any) {
        console.error(`[PCCP] ensureSchema: FAILED to add ${table}.${column}:`, err.code, err.message);
      }
    }
    console.log("[PCCP] ensureSchema: done");
  } catch (err: any) {
    console.error("[PCCP] ensureSchema: FATAL:", err.message);
  }
}
