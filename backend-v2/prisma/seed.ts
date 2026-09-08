import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Driver Master List (20 drivers from Book 5.xlsx) ──────────────────────
// Duplicate resolution:
//   3R-5160: Ko Htet Myat Tun (HO-DRV-012) keeps 3R-5160, Ko Min Khant Ko gets 1L-5160
//   9S-9038: Ko Pyae Phyo Aung (HO-DRV-018) keeps 9S-9038 per issues table,
//            Ko Yan Myo Aung (HO-DRV-015) reassigned to 9S-9032 (was Ko Salai's)
//            Ko Salai (HO-DRV-016) reassigned to 4R-2132 (was Ko Htet Lwin's)
//            Ko Htet Lwin (HO-DRV-017) reassigned to 2R-4244 (was Ko Ye Win Tun's)
//            Ko Ye Win Tun (HO-DRV-011) gets a synthetic plate 4R-5052

interface DriverSeed {
  employeeId: string;
  name: string;
  phone: string;
  vehiclePlate: string;
}

const DRIVERS: DriverSeed[] = [
  { employeeId: "HO-DRV-001", name: "Ko Htet Aung Zaw",   phone: "09-268255686", vehiclePlate: "3R-5121" },
  { employeeId: "HO-DRV-002", name: "Ko San Min Latt",    phone: "09-785150311", vehiclePlate: "9S-6964" },
  { employeeId: "HO-DRV-003", name: "Ko Tun Lin",          phone: "09-750171714", vehiclePlate: "9S-6864" },
  { employeeId: "HO-DRV-004", name: "Ko Nyi Zin",          phone: "09-785379600", vehiclePlate: "9S-6975" },
  { employeeId: "HO-DRV-005", name: "Ko Than Zaw Oo",      phone: "09-787343446", vehiclePlate: "1L-3947" },
  { employeeId: "HO-DRV-006", name: "Ko Win Myint Tun",    phone: "09-898968983", vehiclePlate: "4Q-3897" },
  { employeeId: "HO-DRV-007", name: "Ko Zaw Thu Aung",     phone: "09-755909331", vehiclePlate: "4Q-3959" },
  { employeeId: "HO-DRV-008", name: "Ko Min Khant Ko",     phone: "09-456003099", vehiclePlate: "1L-5160" },
  { employeeId: "HO-DRV-009", name: "Ko Htein Lin",        phone: "09-761755062", vehiclePlate: "2S-2273" },
  { employeeId: "HO-DRV-010", name: "Ko Aung Naing Win",   phone: "09-666662332", vehiclePlate: "4D-1200" },
  { employeeId: "HO-DRV-011", name: "Ko Ye Win Tun",       phone: "09-770760899", vehiclePlate: "4R-5052" },
  { employeeId: "HO-DRV-012", name: "Ko Htet Myat Tun",    phone: "09-941571084", vehiclePlate: "3R-5160" },
  { employeeId: "HO-DRV-013", name: "Ko Aung Thu Hein",    phone: "09-420097656", vehiclePlate: "9S-8931" },
  { employeeId: "HO-DRV-014", name: "Ko Zarni Paing Htoo", phone: "09-764600327", vehiclePlate: "7Q-8284" },
  { employeeId: "HO-DRV-015", name: "Ko Yan Myo Aung",     phone: "09-795549545", vehiclePlate: "9S-9032" },
  { employeeId: "HO-DRV-016", name: "Ko Salai",            phone: "09-403659503", vehiclePlate: "4R-2132" },
  { employeeId: "HO-DRV-017", name: "Ko Htet Lwin",        phone: "09-763778376", vehiclePlate: "2R-4244" },
  { employeeId: "HO-DRV-018", name: "Ko Pyae Phyo Aung",   phone: "09-977301674", vehiclePlate: "9S-9038" },
  { employeeId: "HO-DRV-019", name: "Ko Min Hlaig Soe",    phone: "09-664674483", vehiclePlate: "4Q-3955" },
  { employeeId: "HO-DRV-020", name: "Ko Aung Kyaw Hein",   phone: "09-662888515", vehiclePlate: "4Q-3879" },
];

// ─── Vehicle Master List (20 unique vehicles) ────────────────────────────────
// Resolved duplicates from Book 5.xlsx:
//   3R-5160: Ko Htet Myat Tun (HO-DRV-012) keeps 3R-5160, Ko Min Khant Ko gets 1L-5160
//   9S-9038: Ko Pyae Phyo Aung (HO-DRV-018) keeps 9S-9038 per issues table
//            Ko Yan Myo Aung → 9S-9032, Ko Salai → 4R-2132, Ko Htet Lwin → 2R-4244
//            Ko Ye Win Tun → 4R-5052 (from issues table: Ko Than Zaw Oo alternative)
// 4Q-3955 (NET-019) and 4Q-3879 (NET-020) are the 2 new vehicles.

interface VehicleSeed {
  plateNumber: string;
  netprosUnitId: string;
  isHeadOffice: boolean;
}

const VEHICLES: VehicleSeed[] = [
  { plateNumber: "3R-5121", netprosUnitId: "NET-001", isHeadOffice: true },
  { plateNumber: "9S-6964", netprosUnitId: "NET-002", isHeadOffice: true },
  { plateNumber: "9S-6864", netprosUnitId: "NET-003", isHeadOffice: true },
  { plateNumber: "9S-6975", netprosUnitId: "NET-004", isHeadOffice: true },
  { plateNumber: "1L-3947", netprosUnitId: "NET-005", isHeadOffice: true },
  { plateNumber: "4Q-3897", netprosUnitId: "NET-006", isHeadOffice: true },
  { plateNumber: "4Q-3959", netprosUnitId: "NET-007", isHeadOffice: true },
  { plateNumber: "1L-5160", netprosUnitId: "NET-008", isHeadOffice: true },
  { plateNumber: "2S-2273", netprosUnitId: "NET-009", isHeadOffice: true },
  { plateNumber: "4D-1200", netprosUnitId: "NET-010", isHeadOffice: true },
  { plateNumber: "4R-5052", netprosUnitId: "NET-011", isHeadOffice: true },
  { plateNumber: "3R-5160", netprosUnitId: "NET-012", isHeadOffice: true },
  { plateNumber: "9S-8931", netprosUnitId: "NET-013", isHeadOffice: true },
  { plateNumber: "7Q-8284", netprosUnitId: "NET-014", isHeadOffice: true },
  { plateNumber: "9S-9032", netprosUnitId: "NET-015", isHeadOffice: true },
  { plateNumber: "4R-2132", netprosUnitId: "NET-016", isHeadOffice: true },
  { plateNumber: "2R-4244", netprosUnitId: "NET-017", isHeadOffice: true },
  { plateNumber: "9S-9038", netprosUnitId: "NET-018", isHeadOffice: true },
  { plateNumber: "4Q-3955", netprosUnitId: "NET-019", isHeadOffice: true },
  { plateNumber: "4Q-3879", netprosUnitId: "NET-020", isHeadOffice: true },
];

// ─── Duplicate Resolution ────────────────────────────────────────────────────
// 3R-5160: Ko Htet Myat Tun (HO-DRV-012) keeps 3R-5160, Ko Min Khant Ko gets 1L-5160
// 9S-9038: Ko Pyae Phyo Aung (HO-DRV-018) keeps 9S-9038, Ko Yan Myo Aung gets 9S-9032
// VEHICLES lists one entry per unique plate (20 total, incl. 4Q-3955 and 4Q-3879).

// ─── Seed Script ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting PCCP v2 database seed...\n");

  // Step 1: Upsert all 20 unique vehicles (deduplicated by plate)
  const vehicles: Record<string, string> = {};
  const seenPlates = new Set<string>();

  for (const v of VEHICLES) {
    if (seenPlates.has(v.plateNumber)) continue;
    seenPlates.add(v.plateNumber);

    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: { netprosUnitId: v.netprosUnitId, isHeadOffice: v.isHeadOffice, status: "ACTIVE" },
      create: { plateNumber: v.plateNumber, netprosUnitId: v.netprosUnitId, isHeadOffice: v.isHeadOffice, status: "ACTIVE" },
    });
    vehicles[v.plateNumber] = vehicle.id;
    console.log(`  ✓ Vehicle: ${v.plateNumber} (Unit: ${v.netprosUnitId}, ID: ${vehicle.id})`);
  }

  // Step 2: Upsert all 20 drivers
  const drivers: Record<string, string> = {};

  for (const d of DRIVERS) {
    const driver = await prisma.driver.upsert({
      where: { employeeId: d.employeeId },
      update: { name: d.name, phone: d.phone, status: "AVAILABLE" },
      create: { employeeId: d.employeeId, name: d.name, phone: d.phone, status: "AVAILABLE" },
    });
    drivers[d.employeeId] = driver.id;
    console.log(`  ✓ Driver: ${d.name} (${d.employeeId}) — ${d.phone} — ${d.vehiclePlate}`);
  }

  // Step 3: Create test transport requests
  const testRequest = await prisma.transportRequest.upsert({
    where: { id: "TRQ-TEST-001" },
    update: { status: "ASSIGNED", requestNumber: "TRQ-001" },
    create: {
      id: "TRQ-TEST-001",
      requestNumber: "TRQ-001",
      passengerName: "Daw Thin Thin",
      department: "Finance",
      pickupLocation: "Head Office",
      destination: "Downtown",
      requestDate: new Date(),
      status: "ASSIGNED",
    },
  });
  console.log(`  ✓ Transport Request: ${testRequest.requestNumber} (${testRequest.status})`);

  const thuraRequest = await prisma.transportRequest.upsert({
    where: { id: "TRQ-TEST-002" },
    update: { status: "ASSIGNED", requestNumber: "TRQ-004" },
    create: {
      id: "TRQ-TEST-002",
      requestNumber: "TRQ-004",
      passengerName: "Daw Thin Thin",
      department: "Finance",
      pickupLocation: "Head Office",
      destination: "Downtown",
      requestDate: new Date(),
      status: "ASSIGNED",
    },
  });
  console.log(`  ✓ Transport Request: ${thuraRequest.requestNumber} (${thuraRequest.status})`);

  const pendingRequest = await prisma.transportRequest.upsert({
    where: { id: "TRQ-TEST-003" },
    update: { status: "PENDING", requestNumber: "TRQ-005" },
    create: {
      id: "TRQ-TEST-003",
      requestNumber: "TRQ-005",
      passengerName: "U Kyaw Swar",
      department: "Operations",
      pickupLocation: "Yangon Airport",
      destination: "Inya Lake Hotel",
      requestDate: new Date(),
      status: "PENDING",
    },
  });
  console.log(`  ✓ Transport Request: ${pendingRequest.requestNumber} (${pendingRequest.status})`);

  // Step 4: Create test trips
  const testTrip = await prisma.trip.upsert({
    where: { requestId: "TRQ-TEST-001" },
    update: { status: "PENDING" },
    create: {
      requestId: "TRQ-TEST-001",
      driverId: drivers["HO-DRV-001"],
      vehicleId: vehicles["9S-6964"],
      status: "PENDING",
    },
  });
  console.log(`  ✓ Trip: ${testTrip.id} (Driver: Ko Htet Aung Zaw, Vehicle: 9S-6964, Status: ${testTrip.status})`);

  const thuraTrip = await prisma.trip.upsert({
    where: { requestId: "TRQ-TEST-002" },
    update: { status: "PENDING" },
    create: {
      requestId: "TRQ-TEST-002",
      driverId: drivers["HO-DRV-003"],
      vehicleId: vehicles["9S-6864"],
      status: "PENDING",
    },
  });
  console.log(`  ✓ Trip: ${thuraTrip.id} (Driver: Ko Tun Lin, Vehicle: 9S-6864, Status: ${thuraTrip.status})`);

  // Step 5: Summary
  const vehicleCount = await prisma.vehicle.count();
  const driverCount = await prisma.driver.count();
  const requestCount = await prisma.transportRequest.count();
  const tripCount = await prisma.trip.count();

  console.log("\n── Summary ──────────────────────────────────────────────");
  console.log(`  Vehicles:           ${vehicleCount}`);
  console.log(`  Drivers:            ${driverCount}`);
  console.log(`  Transport Requests: ${requestCount}`);
  console.log(`  Trips:              ${tripCount}`);
  console.log("\n── Duplicate Resolution ──────────────────────────────────");
  console.log("  3R-5160 → Ko Htet Myat Tun (HO-DRV-012)");
  console.log("  1L-5160 → Ko Min Khant Ko (HO-DRV-008)");
  console.log("  9S-9038 → Ko Pyae Phyo Aung (HO-DRV-018)");
  console.log("  9S-9032 → Ko Yan Myo Aung (HO-DRV-015)");
  console.log("  4R-2132 → Ko Salai (HO-DRV-016)");
  console.log("  2R-4244 → Ko Htet Lwin (HO-DRV-017)");
  console.log("  4R-5052 → Ko Ye Win Tun (HO-DRV-011)");
  console.log("\n── Driver-Vehicle Map ───────────────────────────────────");
  for (const d of DRIVERS) {
    console.log(`  ${d.employeeId} ${d.name.padEnd(22)} ${d.phone.padEnd(14)} → ${d.vehiclePlate}`);
  }
  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
