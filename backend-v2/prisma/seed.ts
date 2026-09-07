import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Netpros Wialon API Response (real data) ────────────────────────────────
// Filtered to ONLY include "9S" Head Office vehicles

interface WialonUnitData {
  id: number;
  nm: string;
  cls: number;
}

const NETPROS_UNITS: WialonUnitData[] = [
  { id: 6145, nm: "9S-6865", cls: 6 },
  { id: 6426, nm: "9S-9047", cls: 6 },
  { id: 6140, nm: "9S-6805", cls: 6 },
  // Non-9S vehicles (will be filtered out)
  { id: 5731, nm: "1L-3829", cls: 6 },
  { id: 5800, nm: "2K-1234", cls: 6 },
  { id: 5900, nm: "3M-5678", cls: 6 },
  { id: 6000, nm: "4N-9012", cls: 6 },
  { id: 6100, nm: "5P-3456", cls: 6 },
  { id: 6200, nm: "6Q-7890", cls: 6 },
  { id: 6300, nm: "7R-2345", cls: 6 },
];

// ─── Filter Logic: Only "9S" Head Office vehicles ───────────────────────────

function filterHeadOfficeUnits(units: WialonUnitData[]): WialonUnitData[] {
  return units.filter((u) => u.nm.startsWith("9S"));
}

// ─── Seed Script ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting PCCP v2 database seed...\n");

  // Step 1: Filter Netpros units to Head Office (9S prefix)
  const headOfficeUnits = filterHeadOfficeUnits(NETPROS_UNITS);
  console.log(`Found ${headOfficeUnits.length} Head Office vehicles (9S prefix) out of ${NETPROS_UNITS.length} total units`);

  // Step 2: Upsert Head Office vehicles
  const vehicles: Record<string, string> = {};

  for (const unit of headOfficeUnits) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: unit.nm },
      update: {
        netprosUnitId: String(unit.id),
        isHeadOffice: true,
        status: "ACTIVE",
      },
      create: {
        plateNumber: unit.nm,
        netprosUnitId: String(unit.id),
        isHeadOffice: true,
        status: "ACTIVE",
      },
    });

    vehicles[unit.nm] = vehicle.id;
    console.log(`  ✓ Vehicle: ${unit.nm} (Unit ID: ${unit.id}, ID: ${vehicle.id})`);
  }

  // Step 3: Create 2 test Head Office drivers
  const driver1 = await prisma.driver.upsert({
    where: { employeeId: "HO-DRV-001" },
    update: { name: "U Kyaw Kyaw", status: "AVAILABLE" },
    create: {
      employeeId: "HO-DRV-001",
      name: "U Kyaw Kyaw",
      status: "AVAILABLE",
    },
  });
  console.log(`  ✓ Driver 1: ${driver1.name} (${driver1.employeeId})`);

  const driver2 = await prisma.driver.upsert({
    where: { employeeId: "HO-DRV-002" },
    update: { name: "U Aung Myo", status: "ON_TRIP" },
    create: {
      employeeId: "HO-DRV-002",
      name: "U Aung Myo",
      status: "ON_TRIP",
    },
  });
  console.log(`  ✓ Driver 2: ${driver2.name} (${driver2.employeeId})`);

  // Step 3b: Create test driver Thura Ko Ko (Wialon Driver ID: 54)
  const driver3 = await prisma.driver.upsert({
    where: { employeeId: "HO-DRV-003" },
    update: { name: "Thura Ko Ko", status: "AVAILABLE" },
    create: {
      employeeId: "HO-DRV-003",
      name: "Thura Ko Ko",
      status: "AVAILABLE",
    },
  });
  console.log(`  ✓ Driver 3: ${driver3.name} (${driver3.employeeId}, ID: ${driver3.id})`);

  // Step 3c: Upsert test vehicle 1L-3829 (Wialon Unit ID: 5731)
  const testVehicle = await prisma.vehicle.upsert({
    where: { plateNumber: "1L-3829" },
    update: { netprosUnitId: "5731", isHeadOffice: true, status: "ACTIVE" },
    create: { plateNumber: "1L-3829", netprosUnitId: "5731", isHeadOffice: true, status: "ACTIVE" },
  });
  vehicles["1L-3829"] = testVehicle.id;
  console.log(`  ✓ Vehicle: 1L-3829 (Unit ID: 5731, ID: ${testVehicle.id})`);

  // Step 4: Create 1 Active Test Transport Request (ASSIGNED status)
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

  // Step 5: Create Trip for test request (assigned to Driver 1 + Vehicle 9S-6865)
  const testTrip = await prisma.trip.upsert({
    where: { requestId: "TRQ-TEST-001" },
    update: { status: "PENDING" },
    create: {
      requestId: "TRQ-TEST-001",
      driverId: driver1.id,
      vehicleId: vehicles["9S-6865"],
      status: "PENDING",
    },
  });
  console.log(`  ✓ Trip: ${testTrip.id} (Driver: ${driver1.name}, Vehicle: 9S-6865, Status: ${testTrip.status})`);

  // Step 5b: Create Transport Request + Trip for Thura Ko Ko (Wialon Driver ID: 54)
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
  console.log(`  ✓ Transport Request: ${thuraRequest.requestNumber} (assigned to ${driver3.name})`);

  const thuraTrip = await prisma.trip.upsert({
    where: { requestId: "TRQ-TEST-002" },
    update: { status: "PENDING" },
    create: {
      requestId: "TRQ-TEST-002",
      driverId: driver3.id,
      vehicleId: testVehicle.id,
      status: "PENDING",
    },
  });
  console.log(`  ✓ Trip: ${thuraTrip.id} (Driver: ${driver3.name}, Vehicle: 1L-3829, Status: ${thuraTrip.status})`);

  // Step 5c: Create a PENDING transport request for assignment testing
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

  // Step 6: Summary
  const vehicleCount = await prisma.vehicle.count();
  const driverCount = await prisma.driver.count();
  const requestCount = await prisma.transportRequest.count();
  const tripCount = await prisma.trip.count();

  console.log("\n── Summary ──────────────────────────────────────────────");
  console.log(`  Vehicles:          ${vehicleCount}`);
  console.log(`  Drivers:           ${driverCount}`);
  console.log(`  Transport Requests: ${requestCount}`);
  console.log(`  Trips:             ${tripCount}`);
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
