import { prisma } from "../lib/prisma";
import { createAppError } from "../middlewares/error.middleware";
import { CreateTransportRequestDto, AssignDriverDto, TransportRequestResponse } from "../types";
import { notificationService } from "./notification.service";
import { socketService } from "./socket.service";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ASSIGNED"],
  ASSIGNED: ["QR_PENDING"],
  QR_PENDING: ["PICK_UP_SCANNED"],
  PICK_UP_SCANNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["DROP_OFF_SCANNED"],
  DROP_OFF_SCANNED: ["FEEDBACK_SUBMITTED"],
  FEEDBACK_SUBMITTED: [],
};

export class TransportService {
  async getAll(
    filters?: { status?: string; search?: string; role?: string; userId?: string },
    page = 1,
    limit = 50
  ) {
    const where: Record<string, unknown> = {};

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { passenger: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { driver: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
      ];
    }

    if (filters?.role === "PASSENGER" && filters?.userId) {
      where.passengerId = filters.userId;
    }

    if (filters?.role === "DRIVER" && filters?.userId) {
      where.driverId = filters.userId;
    }

    const [requests, total] = await Promise.all([
      prisma.transportRequest.findMany({
        where,
        include: {
          passenger: { include: { user: { select: { name: true } } } },
          driver: { include: { user: { select: { name: true } } } },
          vehicle: { select: { id: true, plate: true } },
          feedback: { select: { id: true, rating: true } },
          vehicleCheckins: { select: { checkInTime: true, checkOutTime: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transportRequest.count({ where }),
    ]);

    return {
      requests: requests.map(this.formatResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const request = await prisma.transportRequest.findUnique({
      where: { id },
      include: {
        passenger: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        driver: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        vehicle: true,
        feedback: true,
        notifications: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    return request;
  }

  async create(data: CreateTransportRequestDto) {
    const passenger = await prisma.passengerProfile.findUnique({
      where: { userId: data.passengerId },
      include: { user: { select: { name: true } } },
    });

    if (!passenger) {
      throw createAppError(404, "PASSENGER_NOT_FOUND", "Passenger not found");
    }

    const request = await prisma.transportRequest.create({
      data: {
        passengerId: data.passengerId,
        pickup: data.pickup,
        destination: data.destination,
        date: new Date(data.date),
        time: data.time,
        status: "PENDING",
        noOfPeople: data.noOfPeople || 1,
        wayUsers: data.wayUsers || null,
        section: data.section || null,
        serviceType: data.serviceType || null,
        purpose: data.purpose || null,
        returnTime: data.returnTime || null,
        note: data.note || null,
      },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
      },
    });

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    await notificationService.create({
      recipientId: admin?.id ?? "admin-system",
      recipientRole: "ADMIN",
      title: "New Transport Request",
      message: `${passenger.user.name} (${passenger.userId}) requested transport from ${data.pickup} to ${data.destination} on ${data.date} at ${data.time}.`,
      relatedRequestId: request.id,
    });

    const formatted = this.formatResponse({
      ...request,
      driver: null,
      vehicle: null,
      feedback: null,
    });
    socketService.emit("request:new", formatted);
    return formatted;
  }

  async assignDriver(requestId: string, data: AssignDriverDto) {
    const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (request.status !== "PENDING") {
      throw createAppError(
        400,
        "INVALID_TRANSITION",
        `Cannot assign driver to request in '${request.status}' status. Must be PENDING.`
      );
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: data.driverId },
      include: { user: { select: { name: true, phone: true } } },
    });

    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });

    if (!vehicle) {
      throw createAppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
    }

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        status: "ASSIGNED",
      },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true, phone: true } } } },
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
    });

    const passenger = await prisma.passengerProfile.findUnique({
      where: { userId: request.passengerId },
      include: { user: { select: { name: true } } },
    });

    await Promise.all([
      notificationService.create({
        recipientId: request.passengerId,
        recipientRole: "PASSENGER",
        title: "Transport Request Assigned",
        message: `Your transport request ${requestId} has been assigned to Driver ${driver.user.name} (${driver.user.phone || "N/A"}) with vehicle ${vehicle.plate}.`,
        relatedRequestId: requestId,
      }),
      notificationService.create({
        recipientId: data.driverId,
        recipientRole: "DRIVER",
        title: "New Transport Assigned",
        message: `You have been assigned transport request ${requestId} for ${passenger?.user?.name || "a passenger"} from ${request.pickup} to ${request.destination}.`,
        relatedRequestId: requestId,
      }),
    ]);

    return this.formatResponse(updated);
  }

  async assignBatch(requestIds: string[], data: AssignDriverDto) {
    if (!requestIds || requestIds.length === 0) {
      throw createAppError(400, "NO_REQUESTS", "No request IDs provided");
    }

    const requests = await prisma.transportRequest.findMany({
      where: { id: { in: requestIds } },
    });

    if (requests.length !== requestIds.length) {
      throw createAppError(404, "REQUESTS_NOT_FOUND", "One or more transport requests not found");
    }

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    if (pendingRequests.length === 0) {
      throw createAppError(400, "INVALID_TRANSITION", "None of the selected requests are in PENDING status");
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: data.driverId },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
      throw createAppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
    }

    const updatedIds = pendingRequests.map((r) => r.id);

    await prisma.transportRequest.updateMany({
      where: { id: { in: updatedIds } },
      data: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        status: "ASSIGNED",
      },
    });

    // Create notifications for each passenger
    await Promise.all(
      pendingRequests.map((req) =>
        notificationService.create({
          recipientId: req.passengerId,
          recipientRole: "PASSENGER",
          title: "Transport Request Assigned",
          message: `Your transport request ${req.id} has been assigned to Driver ${driver.user.name} (${driver.user.phone || "N/A"}) with vehicle ${vehicle.plate}.`,
          relatedRequestId: req.id,
        })
      )
    );

    // Notify driver of all assignments
    await notificationService.create({
      recipientId: data.driverId,
      recipientRole: "DRIVER",
      title: "Batch Transport Assignment",
      message: `You have been assigned ${updatedIds.length} transport request(s) with vehicle ${vehicle.plate}.`,
    });

    const updated = await prisma.transportRequest.findMany({
      where: { id: { in: updatedIds } },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true, phone: true } } } },
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
    });

    return updated.map((r) => this.formatResponse(r));
  }

  async transitionStatus(requestId: string, newStatus: string) {
    const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    const validNext = VALID_TRANSITIONS[request.status];
    if (!validNext || !validNext.includes(newStatus)) {
      throw createAppError(
        400,
        "INVALID_TRANSITION",
        `Cannot transition from '${request.status}' to '${newStatus}'. Valid transitions: ${validNext?.join(", ") || "none"}`
      );
    }

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true } } } },
        vehicle: true,
      },
    });

    return updated;
  }

  async getStats() {
    const statusCounts = await prisma.transportRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    const departmentCounts = await prisma.transportRequest.groupBy({
      by: ["pickup"],
      _count: true,
    });

    const total = await prisma.transportRequest.count();

    return {
      total,
      byStatus: statusCounts.map((s) => ({ status: s.status, count: s._count })),
      byDepartment: departmentCounts.map((d) => ({ department: d.pickup, count: d._count })),
    };
  }

  private formatResponse(r: {
    id: string;
    passengerId: string;
    passenger: { user: { name: string }; department?: string | null };
    driverId: string | null;
    driver: { user: { name: string } } | null;
    vehicleId: string | null;
    vehicle: { id: string; plate: string } | null;
    status: string;
    pickup: string;
    destination: string;
    date: Date;
    time: string;
    noOfPeople?: number;
    wayUsers?: string | null;
    section?: string | null;
    serviceType?: string | null;
    purpose?: string | null;
    returnTime?: string | null;
    note?: string | null;
    pickedUpAt?: Date | null;
    droppedOffAt?: Date | null;
    waitingTotalMs?: number | null;
    feedback: { id: string; rating: number } | null;
    createdAt: Date;
    vehicleCheckins?: { checkInTime: Date | null; checkOutTime: Date | null; status?: string }[];
  }): TransportRequestResponse {
    let tripHours: number | undefined;
    let drivingHours: number | undefined;

    if (r.pickedUpAt) {
      const end = r.droppedOffAt || new Date();
      const ms = end.getTime() - r.pickedUpAt.getTime();
      if (ms > 0) tripHours = Math.round((ms / 3600000) * 10) / 10;
    }

    const hasActiveCheckin = (r.vehicleCheckins || []).some((c) => c.status === "CHECKED_IN");

    if (r.vehicleCheckins && r.vehicleCheckins.length > 0) {
      const completed = [...r.vehicleCheckins]
        .filter((c) => c.checkInTime && c.checkOutTime)
        .sort((a, b) => (b.checkInTime?.getTime() || 0) - (a.checkInTime?.getTime() || 0));
      const lastCheckin = completed[0];
      if (lastCheckin && lastCheckin.checkInTime && lastCheckin.checkOutTime) {
        const ms = lastCheckin.checkOutTime.getTime() - lastCheckin.checkInTime.getTime();
        if (ms > 0) drivingHours = Math.round((ms / 3600000) * 10) / 10;
      }
    }

    return {
      id: r.id,
      passengerId: r.passengerId,
      passengerName: r.passenger.user.name,
      department: r.passenger.department || "",
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
      qrScanStatus: ["QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"].includes(r.status)
        ? r.status
        : null,
      feedbackStatus: r.feedback ? "SUBMITTED" : null,
      createdAt: r.createdAt.toISOString(),
      hasActiveCheckin,
      tripHours,
      drivingHours,
      waitingTimeMs: r.waitingTotalMs || 0,
    };
  }
}

export const transportService = new TransportService();
