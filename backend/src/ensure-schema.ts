import { prisma } from "./lib/prisma";

export async function ensureSchema(): Promise<void> {
  try {
    const cols = await prisma.$queryRawUnsafe<{ name: string }[]>(
      "PRAGMA table_info(transport_requests)"
    );
    const colNames = cols.map((c) => c.name);
    console.log(`[PCCP] ensureSchema: columns=${colNames.join(",")}`);

    const needed = ["pickedUpAt", "droppedOffAt", "noOfPeople", "wayUsers", "section", "serviceType", "purpose", "returnTime", "note"];
    const missing = needed.filter((c) => !colNames.includes(c));

    if (missing.length === 0) {
      console.log("[PCCP] ensureSchema: all columns present");
      return;
    }

    console.log(`[PCCP] ensureSchema: adding missing columns: ${missing.join(",")}`);
    for (const column of missing) {
      const def = column === "noOfPeople" ? "INTEGER" : "TEXT";
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "transport_requests" ADD COLUMN "${column}" ${def}`);
        console.log(`[PCCP] ensureSchema: added ${column}`);
      } catch (err: any) {
        console.error(`[PCCP] ensureSchema: FAILED ${column}: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error("[PCCP] ensureSchema: ERROR:", err.message);
  }
}
