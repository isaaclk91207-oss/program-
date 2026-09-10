import { prisma } from "../lib/prisma";
import { DashboardStats, TransportRequestResponse } from "../types";
import { gpsHoursService } from "./gps-hours.service";

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
        select: { driverId: true, checkInTime: true, checkOutTime: true },
      }),
      prisma.transportRequest.findMany({
        where: { pickedUpAt: { not: null } },
        select: { driverId: true, pickedUpAt: true, droppedOffAt: true },
      }),
      prisma.driverProfile.findMany({
        select: { userId: true, user: { select: { name: true } } },
      }),
    ]);

    const driverNameMap = new Map(drivers.map((d) => [d.userId, d.user.name]));
    const tripHoursMap: Record<string, number> = {};
    for (const c of checkins) {
      if (!c.checkInTime || !c.checkOutTime || !c.driverId) continue;
      const ms = c.checkOutTime.getTime() - c.checkInTime.getTime();
      if (ms <= 0) continue;
      tripHoursMap[c.driverId] = (tripHoursMap[c.driverId] || 0) + ms;
    }
    const actualHoursMap: Record<string, number> = {};
    for (const r of driveRequests) {
      if (!r.pickedUpAt || !r.driverId) continue;
      const end = r.droppedOffAt || new Date();
      const ms = end.getTime() - r.pickedUpAt.getTime();
      if (ms <= 0) continue;
      actualHoursMap[r.driverId] = (actualHoursMap[r.driverId] || 0) + ms;
    }

    const gpsDriverHoursRaw = await gpsHoursService.getGpsHoursByDriver();
    const gpsDriverHoursMap: Record<string, { gpsHours: number; tripCount: number }> = {};
    for (const d of gpsDriverHoursRaw) {
      gpsDriverHoursMap[d.driverId] = { gpsHours: d.gpsHours, tripCount: d.tripCount };
    }

    const allDriverIds = new Set([
      ...Object.keys(tripHoursMap),
      ...Object.keys(actualHoursMap),
      ...Object.keys(gpsDriverHoursMap),
    ]);
    const driverHours = Array.from(allDriverIds).map((id) => ({
      driverId: id,
      driverName: driverNameMap.get(id) || "Unknown",
      tripHours: Math.round(((tripHoursMap[id] || 0) / 3600000) * 10) / 10,
      actualHours: Math.round(((actualHoursMap[id] || 0) / 3600000) * 10) / 10,
    }));
    const totalTripHours = Math.round(driverHours.reduce((s, d) => s + d.tripHours, 0) * 10) / 10;
    const totalActualHours = Math.round(driverHours.reduce((s, d) => s + d.actualHours, 0) * 10) / 10;

    const gpsDriverHours = gpsDriverHoursRaw.map((d) => ({
      driverId: d.driverId,
      driverName: d.driverName,
      gpsHours: d.gpsHours,
      tripCount: d.tripCount,
    }));
    const totalGpsHours = Math.round(gpsDriverHours.reduce((s, d) => s + d.gpsHours, 0) * 10) / 10;

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
      totalActualHours,
      gpsDriverHours,
      totalGpsHours,
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
      default:
        return [];
    }
  }
}

export const adminService = new AdminService();
