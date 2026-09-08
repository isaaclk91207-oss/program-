import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

// ─── Driver Master List (20 drivers from Book 5.xlsx) ──────────────────────
// Duplicate resolution:
//   3R-5160: Ko Htet Myat Tun keeps 3R-5160, Ko Min Khant Ko gets 1L-5160
//   9S-9038: Ko Pyae Phyo Aung keeps 9S-9038 per issues table,
//            Ko Yan Myo Aung → 9S-9032, Ko Salai → 4R-2132,
//            Ko Htet Lwin → 2R-4244, Ko Ye Win Tun → 4R-5052

interface DriverSeed {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehiclePlate: string;
}

const DRIVERS: DriverSeed[] = [
  { id: "DRV-001", email: "drv001@pccp.demo", name: "Ko Htet Aung Zaw",   phone: "09-268255686", vehiclePlate: "3R-5121" },
  { id: "DRV-002", email: "drv002@pccp.demo", name: "Ko San Min Latt",    phone: "09-785150311", vehiclePlate: "9S-6964" },
  { id: "DRV-003", email: "drv003@pccp.demo", name: "Ko Tun Lin",          phone: "09-750171714", vehiclePlate: "9S-6864" },
  { id: "DRV-004", email: "drv004@pccp.demo", name: "Ko Nyi Zin",          phone: "09-785379600", vehiclePlate: "9S-6975" },
  { id: "DRV-005", email: "drv005@pccp.demo", name: "Ko Than Zaw Oo",      phone: "09-787343446", vehiclePlate: "1L-3947" },
  { id: "DRV-006", email: "drv006@pccp.demo", name: "Ko Win Myint Tun",    phone: "09-898968983", vehiclePlate: "4Q-3897" },
  { id: "DRV-007", email: "drv007@pccp.demo", name: "Ko Zaw Thu Aung",     phone: "09-755909331", vehiclePlate: "4Q-3959" },
  { id: "DRV-008", email: "drv008@pccp.demo", name: "Ko Min Khant Ko",     phone: "09-456003099", vehiclePlate: "1L-5160" },
  { id: "DRV-009", email: "drv009@pccp.demo", name: "Ko Htein Lin",        phone: "09-761755062", vehiclePlate: "2S-2273" },
  { id: "DRV-010", email: "drv010@pccp.demo", name: "Ko Aung Naing Win",   phone: "09-666662332", vehiclePlate: "4D-1200" },
  { id: "DRV-011", email: "drv011@pccp.demo", name: "Ko Ye Win Tun",       phone: "09-770760899", vehiclePlate: "4R-5052" },
  { id: "DRV-012", email: "drv012@pccp.demo", name: "Ko Htet Myat Tun",    phone: "09-941571084", vehiclePlate: "3R-5160" },
  { id: "DRV-013", email: "drv013@pccp.demo", name: "Ko Aung Thu Hein",    phone: "09-420097656", vehiclePlate: "9S-8931" },
  { id: "DRV-014", email: "drv014@pccp.demo", name: "Ko Zarni Paing Htoo", phone: "09-764600327", vehiclePlate: "7Q-8284" },
  { id: "DRV-015", email: "drv015@pccp.demo", name: "Ko Yan Myo Aung",     phone: "09-795549545", vehiclePlate: "9S-9032" },
  { id: "DRV-016", email: "drv016@pccp.demo", name: "Ko Salai",            phone: "09-403659503", vehiclePlate: "4R-2132" },
  { id: "DRV-017", email: "drv017@pccp.demo", name: "Ko Htet Lwin",        phone: "09-763778376", vehiclePlate: "2R-4244" },
  { id: "DRV-018", email: "drv018@pccp.demo", name: "Ko Pyae Phyo Aung",   phone: "09-977301674", vehiclePlate: "9S-9038" },
  { id: "DRV-019", email: "drv019@pccp.demo", name: "Ko Min Hlaig Soe",   phone: "09-664674483", vehiclePlate: "4Q-3955" },
  { id: "DRV-020", email: "drv020@pccp.demo", name: "Ko Aung Kyaw Hein",  phone: "09-662888515", vehiclePlate: "4Q-3879" },
];

// ─── Vehicle Master List (20 unique vehicles from Book 5.xlsx) ──────────────
// gpsDeviceId = verified Wialon avl_unit id (from live S7 NetPros query).
// 1L-5160 and 4R-5052 have no matching Wialon unit → gpsDeviceId: null.
// 4Q-3955 and 4Q-3879 are new vehicles awaiting Wialon unit IDs → gpsDeviceId: null.
const VEHICLES = [
  { plate: "3R-5121", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 3366 },
  { plate: "9S-6964", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 6147 },
  { plate: "9S-6864", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 6423 },
  { plate: "9S-6975", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: 6151 },
  { plate: "1L-3947", make: "Toyota", model: "Hiace", year: 2022, color: "White", status: "ACTIVE", gpsDeviceId: 6704 },
  { plate: "4Q-3897", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 1000 },
  { plate: "4Q-3959", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: 1003 },
  { plate: "1L-5160", make: "Toyota", model: "Hiace", year: 2022, color: "White", status: "ACTIVE", gpsDeviceId: null },
  { plate: "2S-2273", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 4925 },
  { plate: "4D-1200", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: 6471 },
  { plate: "4R-5052", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: null },
  { plate: "3R-5160", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 3348 },
  { plate: "9S-8931", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 6430 },
  { plate: "7Q-8284", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: 6072 },
  { plate: "9S-9032", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 6460 },
  { plate: "4R-2132", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 4928 },
  { plate: "2R-4244", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: 4926 },
  { plate: "9S-9038", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: 6632 },
  { plate: "4Q-3955", make: "Toyota", model: "Hiace", year: 2023, color: "Silver", status: "ACTIVE", gpsDeviceId: null },
  { plate: "4Q-3879", make: "Toyota", model: "Hiace", year: 2023, color: "White", status: "ACTIVE", gpsDeviceId: null },
];

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const driverPassword = await bcrypt.hash("driver123", SALT_ROUNDS);
  const passengerPassword = await bcrypt.hash("passenger123", SALT_ROUNDS);

  // ─── Admin User ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pccp.demo" },
    update: {},
    create: {
      email: "admin@pccp.demo",
      password: adminPassword,
      name: "System Admin",
      role: "ADMIN",
      phone: "+95 9 000 0000",
    },
  });
  console.log(`  ✓ Admin: ${adminUser.id}`);

  // ─── Vehicles ────────────────────────────────────────────────────────────
  const vehicles: Record<string, string> = {};
  for (const v of VEHICLES) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { status: v.status, gpsDeviceId: v.gpsDeviceId ?? null },
      create: { ...v, qrValue: v.plate },
    });
    vehicles[v.plate] = vehicle.id;
  }
  console.log(`  ✓ ${VEHICLES.length} vehicles`);

  // ─── Drivers (20 from Book 5.xlsx) ──────────────────────────────────────
  const driverUserIds: Record<string, string> = {};
  for (const d of DRIVERS) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { name: d.name, phone: d.phone },
      create: {
        id: d.id,
        email: d.email,
        password: driverPassword,
        name: d.name,
        phone: d.phone,
        role: "DRIVER",
      },
    });
    driverUserIds[d.id] = user.id;

    const vehicleId = vehicles[d.vehiclePlate];

    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: { status: "Active", currentVehicleId: vehicleId },
      create: {
        userId: user.id,
        certLevel: "HO",
        certStatus: "CERTIFIED",
        validUntil: new Date("2027-12-31"),
        status: "Active",
        joinedDate: new Date("2024-01-15"),
        accidentFree: "1 yr",
        englishLevel: "B1",
        credits: 500,
        currentVehicleId: vehicleId,
      },
    });

    const existingAssessment = await prisma.assessment.findFirst({ where: { driverId: user.id } });
    if (!existingAssessment) {
      await prisma.assessment.create({
        data: {
          driverId: user.id,
          written: 80,
          practical: JSON.stringify({ preTripReadiness: 80, vehicleInspection: 80, safety: 85, behavior: 80, serviceDelivery: 80 }),
          operational: JSON.stringify({ accidentRecord: 85, vehicleDamage: 80, attendance: 80, documentation: 78, vehicleUtilization: 80 }),
          feedbackAvg: 4.5,
          overallScore: 80,
          certLevel: "HO",
        },
      });
    }
  }
  console.log(`  ✓ ${DRIVERS.length} drivers with assessments`);

  // ─── Passengers ──────────────────────────────────────────────────────────
  const passengersData = [
    { id: "PAS-00128", email: "aung.myo@company.com", name: "U Aung Myo", department: "Executive", phone: "+95 9 123 4567" },
    { id: "PAS-00118", email: "thin.thin@company.com", name: "Daw Thin Thin", department: "Finance", phone: "+95 9 223 4567" },
    { id: "PAS-00102", email: "kyaw.zin@company.com", name: "U Kyaw Zin", department: "HR", phone: "+95 9 323 4567" },
    { id: "PAS-00094", email: "mya@company.com", name: "Daw Mya", department: "Operations", phone: "+95 9 423 4567" },
    { id: "PAS-00071", email: "thein.aung@company.com", name: "U Thein Aung", department: "Marketing", phone: "+95 9 523 4567" },
    { id: "PAS-00061", email: "sandar@company.com", name: "Daw Sandar", department: "IT", phone: "+95 9 623 4567" },
  ];

  const passengerUserIds: Record<string, string> = {};
  for (const p of passengersData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, phone: p.phone },
      create: {
        id: p.id,
        email: p.email,
        password: passengerPassword,
        name: p.name,
        phone: p.phone,
        role: "PASSENGER",
      },
    });
    passengerUserIds[p.id] = user.id;

    await prisma.passengerProfile.upsert({
      where: { userId: user.id },
      update: { department: p.department },
      create: { userId: user.id, department: p.department },
    });
  }
  console.log(`  ✓ ${passengersData.length} passengers`);

  // ─── Transport Requests (using Book 5.xlsx drivers) ─────────────────────
  const requestsData = [
    {
      id: "TRQ-001", passengerId: "PAS-00128", pickup: "Yangon International Airport", destination: "Junction City",
      date: "2026-08-14", time: "10:00 AM", status: "PENDING",
      driverId: null, vehiclePlate: null,
    },
    {
      id: "TRQ-002", passengerId: "PAS-00118", pickup: "Head Office", destination: "Downtown",
      date: "2026-08-14", time: "02:00 PM", status: "ASSIGNED",
      driverId: "DRV-002", vehiclePlate: "9S-6964",
    },
    {
      id: "TRQ-003", passengerId: "PAS-00102", pickup: "Junction City", destination: "Yangon International Airport",
      date: "2026-08-13", time: "08:00 AM", status: "QR_PENDING",
      driverId: "DRV-001", vehiclePlate: "3R-5121",
    },
    {
      id: "TRQ-004", passengerId: "PAS-00094", pickup: "Sule", destination: "Yangon Central Station",
      date: "2026-08-13", time: "11:00 AM", status: "PICK_UP_SCANNED",
      driverId: "DRV-004", vehiclePlate: "9S-6975",
    },
    {
      id: "TRQ-005", passengerId: "PAS-00071", pickup: "Downtown", destination: "Head Office",
      date: "2026-08-12", time: "09:00 AM", status: "DROP_OFF_SCANNED",
      driverId: "DRV-003", vehiclePlate: "9S-6864",
    },
    {
      id: "TRQ-006", passengerId: "PAS-00061", pickup: "Head Office", destination: "Junction City",
      date: "2026-08-12", time: "03:00 PM", status: "FEEDBACK_SUBMITTED",
      driverId: "DRV-001", vehiclePlate: "3R-5121",
    },
    {
      id: "TRQ-007", passengerId: "PAS-00128", pickup: "Yangon International Airport", destination: "Head Office",
      date: "2026-08-11", time: "07:00 AM", status: "FEEDBACK_SUBMITTED",
      driverId: "DRV-002", vehiclePlate: "9S-6964",
    },
    {
      id: "TRQ-008", passengerId: "PAS-00118", pickup: "Downtown", destination: "Yangon International Airport",
      date: "2026-08-11", time: "06:00 PM", status: "PENDING",
      driverId: null, vehiclePlate: null,
    },
  ];

  for (const r of requestsData) {
    await prisma.transportRequest.upsert({
      where: { id: r.id },
      update: { status: r.status },
      create: {
        id: r.id,
        passengerId: passengerUserIds[r.passengerId],
        driverId: r.driverId ? driverUserIds[r.driverId] : null,
        vehicleId: r.vehiclePlate ? vehicles[r.vehiclePlate] : null,
        status: r.status,
        pickup: r.pickup,
        destination: r.destination,
        date: new Date(r.date),
        time: r.time,
      },
    });
  }
  console.log(`  ✓ ${requestsData.length} transport requests`);

  // ─── Feedback Records ────────────────────────────────────────────────────
  const feedbacksData = [
    { requestId: "TRQ-006", passengerId: "PAS-00061", driverId: "DRV-001", vehiclePlate: "3R-5121", rating: 5, comment: "Extremely punctual and courteous. Car was spotless.", tags: ["service", "safety"] },
    { requestId: "TRQ-007", passengerId: "PAS-00128", driverId: "DRV-002", vehiclePlate: "9S-6964", rating: 4, comment: "Smooth and safe journey. Arrived on time.", tags: ["cleanliness"] },
    { requestId: "TRQ-005", passengerId: "PAS-00071", driverId: "DRV-003", vehiclePlate: "9S-6864", rating: 5, comment: "Very professional and friendly driver.", tags: ["behavior"] },
    { requestId: "TRQ-004", passengerId: "PAS-00094", driverId: "DRV-004", vehiclePlate: "9S-6975", rating: 3, comment: "Good service but the vehicle cleanliness needs improvement.", tags: ["cleanliness"] },
  ];

  for (const f of feedbacksData) {
    const existing = await prisma.feedback.findUnique({ where: { requestId: f.requestId } });
    if (!existing) {
      await prisma.feedback.create({
        data: {
          requestId: f.requestId,
          passengerId: passengerUserIds[f.passengerId],
          driverId: driverUserIds[f.driverId],
          vehicleId: vehicles[f.vehiclePlate],
          rating: f.rating,
          comment: f.comment,
          tags: JSON.stringify(f.tags),
        },
      });
    }
  }
  console.log(`  ✓ ${feedbacksData.length} feedback records`);

  // ─── Vehicle Check-ins ───────────────────────────────────────────────────
  const checkinsData = [
    { vehiclePlate: "3R-5121", driverId: "DRV-001", requestId: "TRQ-006", checkInLocation: "Head Office", checkInRemark: "Vehicle clean, no damage", checkOutLocation: "Junction City", checkOutRemark: "No new damage, vehicle clean", status: "CHECKED_OUT" },
    { vehiclePlate: "9S-6964", driverId: "DRV-002", requestId: "TRQ-007", checkInLocation: "Yangon International Airport", checkInRemark: "Minor scratch on rear bumper", checkOutLocation: "Head Office", checkOutRemark: "No new damage", status: "CHECKED_OUT" },
    { vehiclePlate: "9S-6864", driverId: "DRV-003", requestId: "TRQ-005", checkInLocation: "Downtown", checkInRemark: "Vehicle clean", checkOutLocation: "Head Office", checkOutRemark: "Clean, no damage", status: "CHECKED_OUT" },
    { vehiclePlate: "9S-6975", driverId: "DRV-004", requestId: "TRQ-004", checkInLocation: "Sule", checkInRemark: "Vehicle clean, no damage", checkOutLocation: null, checkOutRemark: null, status: "CHECKED_IN" },
  ];

  for (const c of checkinsData) {
    const vehicleId = vehicles[c.vehiclePlate];
    const driverUserId = driverUserIds[c.driverId];
    const existing = await prisma.vehicleCheckin.findFirst({ where: { driverId: driverUserId, requestId: c.requestId } });
    if (!existing) {
      await prisma.vehicleCheckin.create({
        data: {
          vehicleId,
          driverId: driverUserId,
          requestId: c.requestId,
          checkInLocation: c.checkInLocation,
          checkInTime: new Date(),
          checkInRemark: c.checkInRemark,
          checkOutLocation: c.checkOutLocation,
          checkOutTime: c.checkOutLocation ? new Date() : null,
          checkOutRemark: c.checkOutRemark,
          status: c.status,
        },
      });
    }
  }
  console.log(`  ✓ ${checkinsData.length} vehicle check-ins`);

  // ─── Notifications ───────────────────────────────────────────────────────
  const notificationsData = [
    { recipientId: passengerUserIds["PAS-00118"], recipientRole: "PASSENGER", read: false, title: "Transport Request Assigned", message: "Your transport request TRQ-002 has been assigned to Ko San Min Latt with vehicle 9S-6964.", relatedRequestId: "TRQ-002" },
    { recipientId: driverUserIds["DRV-002"], recipientRole: "DRIVER", read: false, title: "New Transport Assigned", message: "You have been assigned transport request TRQ-002 for Daw Thin Thin from Head Office to Downtown.", relatedRequestId: "TRQ-002" },
    { recipientId: passengerUserIds["PAS-00102"], recipientRole: "PASSENGER", read: false, title: "Reminder: Scan Vehicle QR", message: "Please scan the vehicle QR code for your transport request TRQ-003.", relatedRequestId: "TRQ-003" },
    { recipientId: driverUserIds["DRV-001"], recipientRole: "DRIVER", read: true, title: "New Transport Assigned", message: "You have been assigned transport request TRQ-003 for U Kyaw Zin from Junction City to Yangon International Airport.", relatedRequestId: "TRQ-003" },
    { recipientId: passengerUserIds["PAS-00094"], recipientRole: "PASSENGER", read: true, title: "Trip Completed", message: "Your trip TRQ-004 to Yangon Central Station has been completed. Please submit your feedback.", relatedRequestId: "TRQ-004" },
    { recipientId: driverUserIds["DRV-004"], recipientRole: "DRIVER", read: true, title: "Check Out Recorded", message: "Your check-out for vehicle 9S-6975 has been recorded successfully.", relatedRequestId: "TRQ-004" },
    { recipientId: passengerUserIds["PAS-00128"], recipientRole: "PASSENGER", read: false, title: "Trip Completed", message: "Your trip TRQ-007 to Head Office has been completed. Thank you for riding with us.", relatedRequestId: "TRQ-007" },
    { recipientId: driverUserIds["DRV-001"], recipientRole: "DRIVER", read: false, title: "Reminder: QR Verification", message: "Transport request TRQ-003 is awaiting pick-up. Complete QR verification when the passenger arrives.", relatedRequestId: "TRQ-003" },
    { recipientId: adminUser.id, recipientRole: "ADMIN", read: false, title: "New Transport Request", message: "Daw Thin Thin (PAS-00118) requested transport from Head Office to Downtown on 14 Aug 2026 at 10:00 AM.", relatedRequestId: "TRQ-002" },
  ];

  for (const n of notificationsData) {
    const existing = await prisma.notification.findFirst({ where: { recipientId: n.recipientId, title: n.title, relatedRequestId: n.relatedRequestId } });
    if (!existing) {
      await prisma.notification.create({ data: n });
    }
  }
  console.log(`  ✓ ${notificationsData.length} notifications`);

  // ─── System Settings ─────────────────────────────────────────────────────
  await prisma.systemSettings.upsert({ where: { id: "singleton" }, update: {}, create: {} });
  console.log("  ✓ System settings (defaults)");

  console.log("\n── Summary ──────────────────────────────────────────────");
  console.log(`  Drivers:   ${DRIVERS.length}`);
  console.log(`  Vehicles:  ${VEHICLES.length}`);
  console.log(`  Requests:  ${requestsData.length}`);
  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
