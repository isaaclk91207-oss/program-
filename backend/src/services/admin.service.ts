import { PrismaClient } from "@prisma/client";
import { DashboardStats, TransportRequestResponse } from "../types";

const prisma = new PrismaClient();

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
    ]);

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
        qrScanStatus: null,
        feedbackStatus: null,
        createdAt: r.createdAt.toISOString(),
      })),
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
