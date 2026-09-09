import { prisma } from "./lib/prisma";

export async function ensureSchema(): Promise<void> {
  try {
    const url = process.env.DATABASE_URL;
    console.log(`[PCCP] ensureSchema: DATABASE_URL=${url}`);

    const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transport_requests'"
    );
    console.log(`[PCCP] ensureSchema: transport_requests exists: ${tables.length > 0}`);

    if (tables.length === 0) {
      console.log("[PCCP] ensureSchema: table missing, prisma migrate deploy should have created it");
      return;
    }

    const cols = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "PRAGMA table_info(transport_requests)"
    );
    const colNames = cols.map((c) => c.name);
    console.log(`[PCCP] ensureSchema: columns=${colNames.join(",")}`);

    const needed = ["pickedUpAt", "droppedOffAt", "noOfPeople", "wayUsers", "section", "serviceType", "purpose", "returnTime", "note"];
    const missing = needed.filter((c) => !colNames.includes(c));
    console.log(`[PCCP] ensureSchema: missing=${missing.join(",") || "none"}`);

    for (const column of missing) {
      let def = "TEXT";
      if (column === "noOfPeople") def = "INTEGER";
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "transport_requests" ADD COLUMN "${column}" ${def}`);
        console.log(`[PCCP] ensureSchema: added ${column}`);
      } catch (err: any) {
        console.error(`[PCCP] ensureSchema: FAILED ${column}: ${err.message}`);
      }
    }
    console.log("[PCCP] ensureSchema: done");
  } catch (err: any) {
    console.error("[PCCP] ensureSchema: ERROR:", err.message);
  }
}
