import { prisma } from "../lib/prisma";
import { DashboardStats, TransportRequestResponse, TripHoursEntry } from "../types";
import ExcelJS from "exceljs";


export class AdminService {
  async getDashboard(): Promise<DashboardStats> {
    const [
      totalRequests,
      pendingRequests,
      assignedRequests,
      qrPendingRequests,
      inProgressRequests,
      completedRequests,
      feedbackSubmittedRequests,
      totalDrivers,
      activeDrivers,
      totalVehicles,
      activeVehicles,
      requestsByStatus,
      recentRequests,
      checkins,
      driveRequests,
      drivers,
      allTasks,
    ] = await Promise.all([
      prisma.transportRequest.count(),
      prisma.transportRequest.count({ where: { status: "PENDING" } }),
      prisma.transportRequest.count({ where: { status: "ASSIGNED" } }),
      prisma.transportRequest.count({ where: { status: "QR_PENDING" } }),
      prisma.transportRequest.count({ where: { status: "IN_PROGRESS" } }),
      prisma.transportRequest.count({ where: { status: { in: ["PICK_UP_SCANNED", "DROP_OFF_SCANNED"] } } }),
      prisma.transportRequest.count({ where: { status: "FEEDBACK_SUBMITTED" } }),
      prisma.driverProfile.count(),
      prisma.driverProfile.count({ where: { status: "Active" } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.transportRequest.groupBy({ by: ["status"], _count: true }),
      prisma.transportRequest.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          passenger: { include: { user: { select: { name: true } } } },
          driver: { include: { user: { select: { name: true } } } },
          vehicle: { select: { id: true, plate: true } },
        },
      }),
      prisma.vehicleCheckin.findMany({
        select: { driverId: true, checkInTime: true, checkOutTime: true, requestId: true },
      }),
      prisma.transportRequest.findMany({
        where: { pickedUpAt: { not: null } },
        select: { driverId: true, pickedUpAt: true, droppedOffAt: true, id: true, pickup: true, destination: true, date: true, waitingTotalMs: true },
      }),
      prisma.driverProfile.findMany({
        select: { userId: true, user: { select: { name: true } } },
      }),
      prisma.driverTask.findMany({
        select: { driverId: true, startedAt: true, endedAt: true, status: true },
      }),
    ]);

    const driverNameMap = new Map(drivers.map((d) => [d.userId, d.user.name]));

    const drivingHoursMap: Record<string, number> = {};
    for (const c of checkins) {
      if (!c.checkInTime || !c.checkOutTime || !c.driverId) continue;
      const ms = c.checkOutTime.getTime() - c.checkInTime.getTime();
      if (ms <= 0) continue;
      drivingHoursMap[c.driverId] = (drivingHoursMap[c.driverId] || 0) + ms;
    }

    const tripHoursMap: Record<string, number> = {};
    const waitingMap: Record<string, number> = {};
    for (const r of driveRequests) {
      if (!r.pickedUpAt || !r.driverId) continue;
      const end = r.droppedOffAt || new Date();
      const ms = end.getTime() - r.pickedUpAt.getTime();
      if (ms > 0) tripHoursMap[r.driverId] = (tripHoursMap[r.driverId] || 0) + ms;
      waitingMap[r.driverId] = (waitingMap[r.driverId] || 0) + (r.waitingTotalMs || 0);
    }

    const taskMap: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.status !== "COMPLETED" || !t.endedAt) continue;
      const ms = t.endedAt.getTime() - t.startedAt.getTime();
      if (ms > 0) taskMap[t.driverId] = (taskMap[t.driverId] || 0) + ms;
    }

    const allDriverIds = new Set([
      ...Object.keys(drivingHoursMap),
      ...Object.keys(tripHoursMap),
      ...Object.keys(taskMap),
    ]);

    const driverHours = Array.from(allDriverIds).map((id) => {
      const tripByRequest: Record<string, TripHoursEntry> = {};
      for (const r of driveRequests) {
        if (r.driverId !== id || !r.pickedUpAt) continue;
        const end = r.droppedOffAt || new Date();
        const ms = end.getTime() - r.pickedUpAt.getTime();
        if (ms <= 0) continue;
        if (!tripByRequest[r.id]) {
          tripByRequest[r.id] = { requestId: r.id, tripDate: r.date.toISOString().split("T")[0], route: `${r.pickup} → ${r.destination}`, tripHours: 0, drivingHours: 0, waitingTimeMs: 0 };
        }
        tripByRequest[r.id].tripHours = Math.round((ms / 3600000) * 10) / 10;
        tripByRequest[r.id].waitingTimeMs = r.waitingTotalMs || 0;
      }

      return {
        driverId: id,
        driverName: driverNameMap.get(id) || "Unknown",
        tripHours: Math.round(((tripHoursMap[id] || 0) / 3600000) * 10) / 10,
        drivingHours: Math.round(((drivingHoursMap[id] || 0) / 3600000) * 10) / 10,
        waitingTimeMs: waitingMap[id] || 0,
        taskHours: Math.round(((taskMap[id] || 0) / 3600000) * 10) / 10,
        trips: Object.values(tripByRequest),
      };
    });

    const totalTripHours = Math.round(driverHours.reduce((s, d) => s + d.tripHours, 0) * 10) / 10;
    const totalDrivingHours = Math.round(driverHours.reduce((s, d) => s + d.drivingHours, 0) * 10) / 10;
    const totalWaitingTimeMs = driverHours.reduce((s, d) => s + d.waitingTimeMs, 0);
    const totalTaskHours = Math.round(driverHours.reduce((s, d) => s + d.taskHours, 0) * 10) / 10;

    return {
      totalRequests,
      pendingRequests,
      assignedRequests,
      qrPendingRequests,
      inProgressRequests,
      completedRequests,
      feedbackSubmittedRequests,
      totalDrivers,
      activeDrivers,
      totalVehicles,
      activeVehicles,
      requestsByStatus: requestsByStatus.map((s) => ({ status: s.status, count: s._count })),
      requestsByDepartment: [],
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        passengerId: r.passengerId,
        passengerName: r.passenger.user.name,
        department: "",
        driverId: r.driverId,
        driverName: r.driver?.user?.name || null,
        vehicleId: r.vehicleId,
        vehiclePlate: r.vehicle?.plate || null,
        status: r.status,
        pickup: r.pickup,
        destination: r.destination,
        date: r.date.toISOString().split("T")[0],
        time: r.time,
        noOfPeople: r.noOfPeople || 1,
        wayUsers: r.wayUsers || null,
        section: r.section || null,
        serviceType: r.serviceType || null,
        purpose: r.purpose || null,
        returnTime: r.returnTime || null,
        note: r.note || null,
        qrScanStatus: null,
        feedbackStatus: null,
        createdAt: r.createdAt.toISOString(),
        hasActiveCheckin: false,
      })),
      driverHours,
      totalTripHours,
      totalDrivingHours,
      totalWaitingTimeMs,
      totalTaskHours,

    };
  }

  async getSettings() {
    let settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }

    return settings;
  }

  async updateSettings(data: {
    writtenWeight?: number;
    practicalWeight?: number;
    operationalWeight?: number;
    feedbackWeight?: number;
    passMarks?: Record<string, number>;
  }) {
    let settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }

    const updated = await prisma.systemSettings.update({
      where: { id: "singleton" },
      data: {
        ...(data.writtenWeight !== undefined && { writtenWeight: data.writtenWeight }),
        ...(data.practicalWeight !== undefined && { practicalWeight: data.practicalWeight }),
        ...(data.operationalWeight !== undefined && { operationalWeight: data.operationalWeight }),
        ...(data.feedbackWeight !== undefined && { feedbackWeight: data.feedbackWeight }),
        ...(data.passMarks !== undefined && { passMarks: data.passMarks }),
      },
    });

    return updated;
  }

  async exportData(type: string, filters?: Record<string, unknown>) {
    switch (type) {
      case "drivers": {
        const drivers = await prisma.driverProfile.findMany({
          include: {
            user: { select: { name: true, email: true } },
            feedbackRecords: { select: { rating: true } },
            assessments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        });
        return drivers.map((d) => ({
          name: d.user.name,
          id: d.userId,
          email: d.user.email,
          certStatus: d.certStatus,
          level: d.certLevel,
          status: d.status,
          score: d.assessments[0]?.overallScore || 0,
          rating:
            d.feedbackRecords.length > 0
              ? Math.round(d.feedbackRecords.reduce((s, f) => s + f.rating, 0) / d.feedbackRecords.length * 10) / 10
              : 0,
        }));
      }
      case "requests": {
        const requests = await prisma.transportRequest.findMany({
          include: {
            passenger: { include: { user: { select: { name: true } } } },
            driver: { include: { user: { select: { name: true } } } },
            vehicle: { select: { plate: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return requests.map((r) => ({
          id: r.id,
          passengerName: r.passenger.user.name,
          department: "",
          pickup: r.pickup,
          destination: r.destination,
          date: r.date.toISOString().split("T")[0],
          time: r.time,
          noOfPeople: r.noOfPeople || 1,
          wayUsers: r.wayUsers || "",
          section: r.section || "",
          serviceType: r.serviceType || "",
          purpose: r.purpose || "",
          returnTime: r.returnTime || "",
          note: r.note || "",
          status: r.status,
          driverName: r.driver?.user?.name || "",
          vehiclePlate: r.vehicle?.plate || "",
        }));
      }
      case "feedback": {
        const feedbacks = await prisma.feedback.findMany({
          include: {
            passenger: { include: { user: { select: { name: true } } } },
            driver: { include: { user: { select: { name: true } } } },
            vehicle: { select: { plate: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return feedbacks.map((f) => ({
          driverName: f.driver.user.name,
          driverId: f.driverId,
          passengerName: f.passenger.user.name,
          vehiclePlate: f.vehicle.plate,
          requestId: f.requestId,
          rating: f.rating,
          comment: f.comment,
          tags: (typeof f.tags === "string" ? JSON.parse(f.tags) : f.tags as string[]).join("; "),
          date: f.createdAt.toISOString().split("T")[0],
        }));
      }
      case "checkins": {
        const checkins = await prisma.vehicleCheckin.findMany({
          include: {
            driver: { include: { user: { select: { name: true } } } },
            vehicle: { select: { plate: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return checkins.map((c) => ({
          id: c.id,
          driverName: c.driver.user.name,
          driverId: c.driverId,
          vehiclePlate: c.vehicle.plate,
          requestId: c.requestId,
          checkInLocation: c.checkInLocation,
          checkInTime: c.checkInTime?.toISOString() || "",
          checkOutLocation: c.checkOutLocation,
          checkOutTime: c.checkOutTime?.toISOString() || "",
          status: c.status,
        }));
      }
      case "assessments": {
        const drivers = await prisma.driverProfile.findMany({
          include: {
            user: { select: { name: true } },
            assessments: { orderBy: { createdAt: "desc" }, take: 1 },
            feedbackRecords: { select: { rating: true } },
          },
        });
        return drivers.map((d) => ({
          name: d.user.name,
          id: d.userId,
          written: d.assessments[0]?.written || 0,
          overallScore: d.assessments[0]?.overallScore || 0,
          level: d.certLevel,
          certStatus: d.certStatus,
        }));
      }
      case "vehicles": {
        const vehicles = await prisma.vehicle.findMany({
          include: {
            driverProfiles: { select: { user: { select: { name: true } } } },
          },
          orderBy: { plate: "asc" },
        });
        return vehicles.map((v) => ({
          plate: v.plate,
          make: v.make,
          model: v.model,
          year: v.year,
          color: v.color,
          status: v.status,
          assignedDriver: v.driverProfiles[0]?.user.name || "",
          qrValue: v.qrValue,
        }));
      }
      case "passengers": {
        const passengers = await prisma.user.findMany({
          where: { role: "PASSENGER" },
          include: {
            passengerProfile: { 
              select: { department: true },
              include: { 
                transportRequests: { select: { id: true, status: true } }
              }
            },
          },
          orderBy: { name: "asc" },
        });
        return passengers.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone || "",
          department: p.passengerProfile?.department || "",
          totalRequests: p.passengerProfile?.transportRequests.length || 0,
          completedRequests: p.passengerProfile?.transportRequests.filter((r) => r.status === "FEEDBACK_SUBMITTED").length || 0,
        }));
      }
      default:
        return [];
    }
  }

  async exportToExcel(type: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PCCP System";
    workbook.created = new Date();

    const data = await this.exportData(type);
    if (!data.length) {
      const emptySheet = workbook.addWorksheet(type);
      emptySheet.addRow(["No data available"]);
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    const sheet = workbook.addWorksheet(type, {
      properties: { tabColor: { argb: "FF00796B" } },
    });

    const keys = Object.keys(data[0]);
    sheet.columns = keys.map((k) => ({
      header: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1"),
      key: k,
      width: Math.max(k.length + 2, 15),
    }));

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00796B" },
    };

    data.forEach((row) => {
      sheet.addRow(row);
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const adminService = new AdminService();
