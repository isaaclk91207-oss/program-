import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

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
  const vehiclesData = [
    { plate: "YGN-3312", make: "Toyota", model: "Alphard", year: 2023, color: "White", status: "ACTIVE" },
    { plate: "YGN-1187", make: "Toyota", model: "Vellfire", year: 2022, color: "Black", status: "ACTIVE" },
    { plate: "YGN-4420", make: "Honda", model: "Odyssey", year: 2023, color: "Silver", status: "ACTIVE" },
    { plate: "YGN-2260", make: "Toyota", model: "Estima", year: 2022, color: "White", status: "ACTIVE" },
    { plate: "YGN-9021", make: "Toyota", model: "Wish", year: 2024, color: "Grey", status: "ACTIVE" },
    { plate: "YGN-6631", make: "Toyota", model: "Noah", year: 2023, color: "White", status: "MAINTENANCE" },
    { plate: "YGN-7742", make: "Honda", model: "Freed", year: 2024, color: "Silver", status: "ACTIVE" },
    { plate: "YGN-5590", make: "Toyota", model: "Alphard", year: 2022, color: "Black", status: "ACTIVE" },
    { plate: "YGN-0043", make: "Toyota", model: "Vellfire", year: 2022, color: "Black", status: "RETIRED" },
  ];

  const vehicles: Record<string, string> = {};
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { status: v.status },
      create: { ...v, qrValue: v.plate },
    });
    vehicles[v.plate] = vehicle.id;
  }
  console.log(`  ✓ ${vehiclesData.length} vehicles`);

  // ─── Drivers ─────────────────────────────────────────────────────────────
  const driversData = [
    {
      id: "DRV-001", email: "komaung@pccp.demo", name: "Ko Maung", phone: "+95 9 214 6683",
      certLevel: "CPC", certStatus: "CERTIFIED", validUntil: "2026-12-31", status: "Active",
      joinedDate: "2023-03-12", accidentFree: "3 yrs", englishLevel: "B2", credits: 1250,
      vehicle: "YGN-3312",
      assessment: { written: 88, practical: { preTripReadiness: 92, vehicleInspection: 90, safety: 95, behavior: 90, serviceDelivery: 88 }, operational: { accidentRecord: 95, vehicleDamage: 90, attendance: 88, documentation: 85, vehicleUtilization: 87 }, feedbackAvg: 4.9 },
    },
    {
      id: "DRV-002", email: "koaung@pccp.demo", name: "Ko Aung", phone: "+95 9 254 1120",
      certLevel: "CPC", certStatus: "CERTIFIED", validUntil: "2026-11-18", status: "Active",
      joinedDate: "2023-06-02", accidentFree: "2 yrs", englishLevel: "B1", credits: 980,
      vehicle: "YGN-1187",
      assessment: { written: 85, practical: { preTripReadiness: 88, vehicleInspection: 86, safety: 92, behavior: 88, serviceDelivery: 90 }, operational: { accidentRecord: 90, vehicleDamage: 88, attendance: 85, documentation: 82, vehicleUtilization: 90 }, feedbackAvg: 4.8 },
    },
    {
      id: "DRV-003", email: "komin@pccp.demo", name: "Ko Min", phone: "+95 9 442 9931",
      certLevel: "CC", certStatus: "CERTIFIED", validUntil: "2027-02-05", status: "Active",
      joinedDate: "2023-09-21", accidentFree: "2 yrs", englishLevel: "B1", credits: 760,
      vehicle: "YGN-4420",
      assessment: { written: 80, practical: { preTripReadiness: 84, vehicleInspection: 82, safety: 88, behavior: 82, serviceDelivery: 84 }, operational: { accidentRecord: 85, vehicleDamage: 82, attendance: 80, documentation: 78, vehicleUtilization: 84 }, feedbackAvg: 4.7 },
    },
    {
      id: "DRV-004", email: "komyo@pccp.demo", name: "Ko Myo", phone: "+95 9 761 0021",
      certLevel: "CC", certStatus: "CERTIFIED", validUntil: "2027-01-14", status: "Active",
      joinedDate: "2024-01-30", accidentFree: "1 yr", englishLevel: "A2", credits: 540,
      vehicle: "YGN-2260",
      assessment: { written: 78, practical: { preTripReadiness: 80, vehicleInspection: 78, safety: 84, behavior: 80, serviceDelivery: 82 }, operational: { accidentRecord: 82, vehicleDamage: 80, attendance: 78, documentation: 80, vehicleUtilization: 92 }, feedbackAvg: 4.6 },
    },
    {
      id: "DRV-005", email: "kaung.htet@pccp.demo", name: "Kaung Htet", phone: "+95 9 555 2214",
      certLevel: "CD", certStatus: "CERTIFIED", validUntil: "2026-08-09", status: "Active",
      joinedDate: "2024-04-17", accidentFree: "1 yr", englishLevel: "A2", credits: 410,
      vehicle: "YGN-9021",
      assessment: { written: 76, practical: { preTripReadiness: 78, vehicleInspection: 76, safety: 82, behavior: 76, serviceDelivery: 78 }, operational: { accidentRecord: 80, vehicleDamage: 78, attendance: 76, documentation: 74, vehicleUtilization: 86 }, feedbackAvg: 4.4 },
    },
    {
      id: "DRV-006", email: "zin.min@pccp.demo", name: "Zin Min Latt", phone: "+95 9 887 4402",
      certLevel: "CD", certStatus: "PENDING", validUntil: null, status: "Active",
      joinedDate: "2024-07-03", accidentFree: null, englishLevel: "A2", credits: 210,
      vehicle: "YGN-6631",
      assessment: { written: 70, practical: { preTripReadiness: 72, vehicleInspection: 70, safety: 78, behavior: 72, serviceDelivery: 76 }, operational: { accidentRecord: 74, vehicleDamage: 72, attendance: 70, documentation: 68, vehicleUtilization: 76 }, feedbackAvg: 4.1 },
    },
    {
      id: "DRV-007", email: "thura.aung@pccp.demo", name: "Thura Aung", phone: "+95 9 320 7754",
      certLevel: "CD", certStatus: "PENDING", validUntil: null, status: "Active",
      joinedDate: "2024-08-22", accidentFree: null, englishLevel: "A2", credits: 150,
      vehicle: "YGN-7742",
      assessment: { written: 65, practical: { preTripReadiness: 66, vehicleInspection: 64, safety: 72, behavior: 68, serviceDelivery: 70 }, operational: { accidentRecord: 70, vehicleDamage: 68, attendance: 66, documentation: 64, vehicleUtilization: 78 }, feedbackAvg: 3.8 },
    },
    {
      id: "DRV-008", email: "nay.lin@pccp.demo", name: "Nay Lin Oo", phone: "+95 9 611 0087",
      certLevel: "CC", certStatus: "SUSPENDED", validUntil: null, status: "Inactive",
      joinedDate: "2023-11-11", accidentFree: null, englishLevel: "B1", credits: 620,
      vehicle: "YGN-5590",
      assessment: { written: 74, practical: { preTripReadiness: 72, vehicleInspection: 70, safety: 74, behavior: 68, serviceDelivery: 66 }, operational: { accidentRecord: 68, vehicleDamage: 66, attendance: 70, documentation: 68, vehicleUtilization: 72 }, feedbackAvg: 3.2 },
    },
    {
      id: "DRV-009", email: "htet.wai@pccp.demo", name: "Htet Wai Yan", phone: "+95 9 992 3345",
      certLevel: "CPC", certStatus: "REVOKED", validUntil: null, status: "Inactive",
      joinedDate: "2022-12-05", accidentFree: null, englishLevel: "B2", credits: 900,
      vehicle: "YGN-0043",
      assessment: { written: 60, practical: { preTripReadiness: 58, vehicleInspection: 56, safety: 62, behavior: 58, serviceDelivery: 54 }, operational: { accidentRecord: 55, vehicleDamage: 54, attendance: 56, documentation: 52, vehicleUtilization: 58 }, feedbackAvg: 2.6 },
    },
    {
      id: "DRV-010", email: "soe.moe@pccp.demo", name: "Soe Moe Kyaw", phone: "+95 9 470 8812",
      certLevel: "CD", certStatus: "CERTIFIED", validUntil: "2026-10-27", status: "Active",
      joinedDate: "2024-02-14", accidentFree: "2 yrs", englishLevel: "B1", credits: 380,
      vehicle: "YGN-3387",
      assessment: { written: 82, practical: { preTripReadiness: 84, vehicleInspection: 82, safety: 88, behavior: 84, serviceDelivery: 86 }, operational: { accidentRecord: 86, vehicleDamage: 84, attendance: 82, documentation: 80, vehicleUtilization: 92 }, feedbackAvg: 4.7 },
    },
  ];

  const driverUserIds: Record<string, string> = {};
  for (const d of driversData) {
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

    const vehicleId = vehicles[d.vehicle];

    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: {
        certLevel: d.certLevel,
        certStatus: d.certStatus,
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        status: d.status,
        joinedDate: new Date(d.joinedDate),
        accidentFree: d.accidentFree,
        englishLevel: d.englishLevel,
        credits: d.credits,
        currentVehicleId: vehicleId,
      },
      create: {
        userId: user.id,
        certLevel: d.certLevel,
        certStatus: d.certStatus,
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        status: d.status,
        joinedDate: new Date(d.joinedDate),
        accidentFree: d.accidentFree,
        englishLevel: d.englishLevel,
        credits: d.credits,
        currentVehicleId: vehicleId,
      },
    });

    const feedbackAvg = d.assessment.feedbackAvg;
    const practicalScore =
      d.assessment.practical.preTripReadiness * 0.2 +
      d.assessment.practical.vehicleInspection * 0.2 +
      d.assessment.practical.safety * 0.3 +
      d.assessment.practical.behavior * 0.15 +
      d.assessment.practical.serviceDelivery * 0.15;
    const operationalScore =
      d.assessment.operational.accidentRecord * 0.2 +
      d.assessment.operational.vehicleDamage * 0.2 +
      d.assessment.operational.attendance * 0.2 +
      d.assessment.operational.documentation * 0.1 +
      d.assessment.operational.vehicleUtilization * 0.3;
    const feedback100 = feedbackAvg * 20;
    const overallScore = Math.round(
      (d.assessment.written * 0.2 + practicalScore * 0.3 + operationalScore * 0.3 + feedback100 * 0.2) * 100
    ) / 100;

    await prisma.assessment.create({
      data: {
        driverId: user.id,
        written: d.assessment.written,
        practical: JSON.stringify(d.assessment.practical),
        operational: JSON.stringify(d.assessment.operational),
        feedbackAvg,
        overallScore,
        certLevel: d.certLevel,
      },
    });
  }
  console.log(`  ✓ ${driversData.length} drivers with assessments`);

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

  // ─── Transport Requests ──────────────────────────────────────────────────
  const requestsData = [
    {
      id: "TRQ-001", passengerId: "PAS-00128", pickup: "Yangon International Airport", destination: "Junction City",
      date: "2026-08-14", time: "10:00 AM", status: "PENDING",
      driverId: null, vehiclePlate: null,
    },
    {
      id: "TRQ-002", passengerId: "PAS-00118", pickup: "Head Office", destination: "Downtown",
      date: "2026-08-14", time: "02:00 PM", status: "ASSIGNED",
      driverId: "DRV-002", vehiclePlate: "YGN-1187",
    },
    {
      id: "TRQ-003", passengerId: "PAS-00102", pickup: "Junction City", destination: "Yangon International Airport",
      date: "2026-08-13", time: "08:00 AM", status: "QR_PENDING",
      driverId: "DRV-001", vehiclePlate: "YGN-3312",
    },
    {
      id: "TRQ-004", passengerId: "PAS-00094", pickup: "Sule", destination: "Yangon Central Station",
      date: "2026-08-13", time: "11:00 AM", status: "PICK_UP_SCANNED",
      driverId: "DRV-004", vehiclePlate: "YGN-2260",
    },
    {
      id: "TRQ-005", passengerId: "PAS-00071", pickup: "Downtown", destination: "Head Office",
      date: "2026-08-12", time: "09:00 AM", status: "DROP_OFF_SCANNED",
      driverId: "DRV-003", vehiclePlate: "YGN-4420",
    },
    {
      id: "TRQ-006", passengerId: "PAS-00061", pickup: "Head Office", destination: "Junction City",
      date: "2026-08-12", time: "03:00 PM", status: "FEEDBACK_SUBMITTED",
      driverId: "DRV-001", vehiclePlate: "YGN-3312",
    },
    {
      id: "TRQ-007", passengerId: "PAS-00128", pickup: "Yangon International Airport", destination: "Head Office",
      date: "2026-08-11", time: "07:00 AM", status: "FEEDBACK_SUBMITTED",
      driverId: "DRV-002", vehiclePlate: "YGN-1187",
    },
    {
      id: "TRQ-008", passengerId: "PAS-00118", pickup: "Downtown", destination: "Yangon International Airport",
      date: "2026-08-11", time: "06:00 PM", status: "PENDING",
      driverId: null, vehiclePlate: null,
    },
  ];

  for (const r of requestsData) {
    const passengerProfile = await prisma.passengerProfile.findUnique({
      where: { userId: passengerUserIds[r.passengerId] },
    });

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
    {
      requestId: "TRQ-006", passengerId: "PAS-00061", driverId: "DRV-001", vehiclePlate: "YGN-3312",
      rating: 5, comment: "Extremely punctual and courteous. Car was spotless.", tags: ["service", "safety"],
    },
    {
      requestId: "TRQ-007", passengerId: "PAS-00128", driverId: "DRV-002", vehiclePlate: "YGN-1187",
      rating: 4, comment: "Smooth and safe journey. Arrived on time.", tags: ["cleanliness"],
    },
    {
      requestId: "TRQ-005", passengerId: "PAS-00071", driverId: "DRV-003", vehiclePlate: "YGN-4420",
      rating: 5, comment: "Very professional and friendly driver.", tags: ["behavior"],
    },
    {
      requestId: "TRQ-004", passengerId: "PAS-00094", driverId: "DRV-004", vehiclePlate: "YGN-2260",
      rating: 3, comment: "Good service but the vehicle cleanliness needs improvement.", tags: ["cleanliness"],
    },
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
    {
      vehiclePlate: "YGN-3312", driverId: "DRV-001", requestId: "TRQ-006",
      checkInLocation: "Head Office", checkInRemark: "Vehicle clean, no damage",
      checkOutLocation: "Junction City", checkOutRemark: "No new damage, vehicle clean",
      status: "CHECKED_OUT",
    },
    {
      vehiclePlate: "YGN-1187", driverId: "DRV-002", requestId: "TRQ-007",
      checkInLocation: "Yangon International Airport", checkInRemark: "Minor scratch on rear bumper",
      checkOutLocation: "Head Office", checkOutRemark: "No new damage",
      status: "CHECKED_OUT",
    },
    {
      vehiclePlate: "YGN-4420", driverId: "DRV-003", requestId: "TRQ-005",
      checkInLocation: "Downtown", checkInRemark: "Vehicle clean",
      checkOutLocation: "Head Office", checkOutRemark: "Clean, no damage",
      status: "CHECKED_OUT",
    },
    {
      vehiclePlate: "YGN-2260", driverId: "DRV-004", requestId: "TRQ-004",
      checkInLocation: "Sule", checkInRemark: "Vehicle clean, no damage",
      checkOutLocation: null, checkOutRemark: null,
      status: "CHECKED_IN",
    },
  ];

  for (const c of checkinsData) {
    const vehicleId = vehicles[c.vehiclePlate];
    const driverUserId = driverUserIds[c.driverId];

    const existing = await prisma.vehicleCheckin.findFirst({
      where: { driverId: driverUserId, requestId: c.requestId },
    });

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
    {
      recipientId: passengerUserIds["PAS-00118"], recipientRole: "PASSENGER", read: false,
      title: "Transport Request Assigned",
      message: "Your transport request TRQ-002 has been assigned to Driver Ko Aung with vehicle YGN-1187.",
      relatedRequestId: "TRQ-002",
    },
    {
      recipientId: driverUserIds["DRV-002"], recipientRole: "DRIVER", read: false,
      title: "New Transport Assigned",
      message: "You have been assigned transport request TRQ-002 for Daw Thin Thin from Head Office to Downtown.",
      relatedRequestId: "TRQ-002",
    },
    {
      recipientId: passengerUserIds["PAS-00102"], recipientRole: "PASSENGER", read: false,
      title: "Reminder: Scan Vehicle QR",
      message: "Please scan the vehicle QR code for your transport request TRQ-003.",
      relatedRequestId: "TRQ-003",
    },
    {
      recipientId: driverUserIds["DRV-001"], recipientRole: "DRIVER", read: true,
      title: "New Transport Assigned",
      message: "You have been assigned transport request TRQ-003 for U Kyaw Zin from Junction City to Yangon International Airport.",
      relatedRequestId: "TRQ-003",
    },
    {
      recipientId: passengerUserIds["PAS-00094"], recipientRole: "PASSENGER", read: true,
      title: "Trip Completed",
      message: "Your trip TRQ-004 to Yangon Central Station has been completed. Please submit your feedback.",
      relatedRequestId: "TRQ-004",
    },
    {
      recipientId: driverUserIds["DRV-004"], recipientRole: "DRIVER", read: true,
      title: "Check Out Recorded",
      message: "Your check-out for vehicle YGN-2260 has been recorded successfully.",
      relatedRequestId: "TRQ-004",
    },
    {
      recipientId: passengerUserIds["PAS-00128"], recipientRole: "PASSENGER", read: false,
      title: "Trip Completed",
      message: "Your trip TRQ-007 to Head Office has been completed. Thank you for riding with us.",
      relatedRequestId: "TRQ-007",
    },
    {
      recipientId: driverUserIds["DRV-001"], recipientRole: "DRIVER", read: false,
      title: "Reminder: QR Verification",
      message: "Transport request TRQ-003 is awaiting pick-up. Complete QR verification when the passenger arrives.",
      relatedRequestId: "TRQ-003",
    },
    {
      recipientId: adminUser.id, recipientRole: "ADMIN", read: false,
      title: "New Transport Request",
      message: "Daw Thin Thin (PAS-00118) requested transport from Head Office to Downtown on 14 Aug 2026 at 10:00 AM.",
      relatedRequestId: "TRQ-002",
    },
  ];

  for (const n of notificationsData) {
    const existing = await prisma.notification.findFirst({
      where: { recipientId: n.recipientId, title: n.title, relatedRequestId: n.relatedRequestId },
    });

    if (!existing) {
      await prisma.notification.create({ data: n });
    }
  }
  console.log(`  ✓ ${notificationsData.length} notifications`);

  // ─── System Settings ─────────────────────────────────────────────────────
  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {},
  });
  console.log("  ✓ System settings (defaults)");

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
