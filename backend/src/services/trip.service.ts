import { prisma } from "../lib/prisma";
import { createAppError } from "../middlewares/error.middleware";
import { QRScanPayload, QRVerificationResult, CheckInDto, CheckOutDto } from "../types";
import { transportService } from "./transport.service";
import { vehicleService } from "./vehicle.service";
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

export class TripService {
  async verifyQR(payload: QRScanPayload, userId: string, role: string): Promise<QRVerificationResult> {
    const vehicle = await vehicleService.findByQrValue(payload.qrValue);

    if (!vehicle) {
      return { valid: false, error: "QR not registered" };
    }

    if (vehicle.status !== "ACTIVE") {
      return { valid: false, error: "Vehicle not valid (inactive/maintenance)" };
    }

    if (role === "PASSENGER") {
      const activeRequest = await prisma.transportRequest.findFirst({
        where: {
          passengerId: userId,
          status: { in: ["QR_PENDING", "ASSIGNED"] },
          vehicleId: vehicle.id,
        },
      });

      if (!activeRequest) {
        return { valid: false, error: "This QR code does not match your assigned vehicle." };
      }

      return { valid: true, vehiclePlate: vehicle.plate };
    }

    if (role === "DRIVER") {
      const activeRequest = await prisma.transportRequest.findFirst({
        where: {
          driverId: userId,
          status: { in: ["QR_PENDING", "ASSIGNED", "IN_PROGRESS"] },
          vehicleId: vehicle.id,
        },
      });

      if (!activeRequest) {
        return { valid: false, error: "This QR code does not match your assigned vehicle." };
      }

      return { valid: true, vehiclePlate: vehicle.plate };
    }

    return { valid: false, error: "Invalid role for QR verification" };
  }

  async pickupQRScan(requestId: string, userId: string) {
    const request = await prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: { vehicle: true },
    });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (request.passengerId !== userId) {
      throw createAppError(403, "FORBIDDEN", "This request does not belong to you");
    }

    if (request.status !== "QR_PENDING" && request.status !== "ASSIGNED") {
      throw createAppError(
        400,
        "INVALID_TRANSITION",
        `Cannot scan pickup QR for request in '${request.status}' status`
      );
    }

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: "PICK_UP_SCANNED", pickedUpAt: new Date() },
    });

    socketService.emit("trip:statusChanged", { requestId, status: "PICK_UP_SCANNED", driverId: request.driverId, pickedUpAt: updated.pickedUpAt });

    return updated;
  }

  async dropoffQRScan(requestId: string, userId: string) {
    const request = await prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: { vehicle: true },
    });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (request.passengerId !== userId) {
      throw createAppError(403, "FORBIDDEN", "This request does not belong to you");
    }

    if (request.status !== "IN_PROGRESS" && request.status !== "PICK_UP_SCANNED") {
      throw createAppError(
        400,
        "INVALID_TRANSITION",
        `Cannot scan dropoff QR for request in '${request.status}' status`
      );
    }

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: "DROP_OFF_SCANNED", droppedOffAt: new Date() },
    });

    socketService.emit("trip:statusChanged", { requestId, status: "DROP_OFF_SCANNED", driverId: request.driverId, droppedOffAt: updated.droppedOffAt });

    return updated;
  }

  async driverCheckIn(driverId: string, data: CheckInDto) {
    const vehicle = await vehicleService.getByPlate(data.vehiclePlate);

    const activeRequest = await prisma.transportRequest.findFirst({
      where: {
        driverId,
        vehicleId: vehicle.id,
        status: { in: ["ASSIGNED", "QR_PENDING"] },
      },
    });

    if (!activeRequest) {
      throw createAppError(
        400,
        "NO_ACTIVE_TRIP",
        "No active trip found for this driver and vehicle combination"
      );
    }

    const existingCheckin = await prisma.vehicleCheckin.findFirst({
      where: {
        driverId,
        requestId: activeRequest.id,
        status: "CHECKED_IN",
      },
    });

    if (existingCheckin) {
      throw createAppError(400, "ALREADY_CHECKED_IN", "Already checked in for this trip");
    }

    const checkin = await prisma.vehicleCheckin.create({
      data: {
        vehicleId: vehicle.id,
        driverId,
        requestId: activeRequest.id,
        checkInLocation: data.location,
        checkInTime: new Date(),
        checkInRemark: data.remark,
        status: "CHECKED_IN",
        checkedBy: "DRIVER",
      },
    });

    socketService.emit("trip:statusChanged", { requestId: activeRequest.id, status: "CHECKED_IN", driverId, checkInTime: checkin.checkInTime });

    await notificationService.create({
      recipientId: driverId,
      recipientRole: "driver",
      title: "Check-In Recorded",
      message: `Your check-in for vehicle ${data.vehiclePlate} has been recorded successfully.`,
      relatedRequestId: activeRequest.id,
    });

    return checkin;
  }

  async driverCheckOut(driverId: string, data: CheckOutDto) {
    const vehicle = await vehicleService.getByPlate(data.vehiclePlate);

    const checkin = await prisma.vehicleCheckin.findFirst({
      where: {
        driverId,
        vehicleId: vehicle.id,
        status: "CHECKED_IN",
      },
      include: { transportRequest: true },
    });

    if (!checkin) {
      throw createAppError(404, "NO_ACTIVE_CHECKIN", "No active check-in found for this vehicle");
    }

    const updated = await prisma.vehicleCheckin.update({
      where: { id: checkin.id },
      data: {
        checkOutLocation: data.location,
        checkOutTime: new Date(),
        checkOutRemark: data.remark,
        status: "CHECKED_OUT",
      },
    });

    socketService.emit("trip:statusChanged", { requestId: checkin.requestId, status: "CHECKED_OUT", driverId, checkOutTime: updated.checkOutTime });

    if (checkin.transportRequest) {
      const currentStatus = checkin.transportRequest.status;
      if (currentStatus === "PICK_UP_SCANNED" || currentStatus === "QR_PENDING" || currentStatus === "ASSIGNED") {
        await prisma.transportRequest.update({
          where: { id: checkin.transportRequest.id },
          data: { status: "IN_PROGRESS" },
        });
        socketService.emit("trip:statusChanged", { requestId: checkin.transportRequest.id, status: "IN_PROGRESS", driverId });
      }
    }

    await notificationService.create({
      recipientId: driverId,
      recipientRole: "driver",
      title: "Check-Out Recorded",
      message: `Your check-out for vehicle ${data.vehiclePlate} has been recorded successfully.`,
      relatedRequestId: checkin.requestId,
    });

    return updated;
  }

  async getDriverTrips(driverId: string, status?: string) {
    const where: Record<string, unknown> = { driverId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const trips = await prisma.transportRequest.findMany({
      where,
      include: {
        driver: { include: { user: { select: { name: true } } } },
        passenger: { include: { user: { select: { name: true, phone: true, email: true } } } },
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
      orderBy: { date: "desc" },
    });

    // Check for active check-ins for these trips
    const tripIds = trips.map((t) => t.id);
    const activeCheckins = await prisma.vehicleCheckin.findMany({
      where: {
        requestId: { in: tripIds },
        status: "CHECKED_IN",
      },
      select: { requestId: true },
    });
    const activeCheckinSet = new Set(activeCheckins.map((c) => c.requestId));

    return trips.map((t) => this.formatTripResponse(t, activeCheckinSet.has(t.id)));
  }

  async getPassengerTrips(passengerId: string, status?: string) {
    const where: Record<string, unknown> = { passengerId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const trips = await prisma.transportRequest.findMany({
      where,
      include: {
        driver: { include: { user: { select: { name: true, phone: true } } } },
        passenger: { include: { user: { select: { name: true } } } },
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
      orderBy: { date: "desc" },
    });

    return trips.map((t) => this.formatTripResponse(t, false));
  }

  async getTripDetail(requestId: string) {
    const request = await prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
        driver: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
            currentVehicle: true,
          },
        },
        vehicle: true,
        feedback: true,
        vehicleCheckins: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    return request;
  }

  async adminCheckIn(driverId: string, data: CheckInDto) {
    const vehicle = await vehicleService.getByPlate(data.vehiclePlate);

    const activeRequest = await prisma.transportRequest.findFirst({
      where: {
        driverId,
        vehicleId: vehicle.id,
        status: { in: ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED"] },
      },
    });

    if (!activeRequest) {
      throw createAppError(400, "NO_ACTIVE_TRIP", "No active trip found for this driver and vehicle combination");
    }

    const existingCheckin = await prisma.vehicleCheckin.findFirst({
      where: {
        driverId,
        status: "CHECKED_IN",
      },
    });

    if (existingCheckin) {
      throw createAppError(400, "ALREADY_CHECKED_IN", "Driver is already checked in");
    }

    const checkin = await prisma.vehicleCheckin.create({
      data: {
        vehicleId: vehicle.id,
        driverId,
        requestId: activeRequest.id,
        checkInLocation: data.location,
        checkInTime: new Date(),
        checkInRemark: data.remark,
        status: "CHECKED_IN",
        checkedBy: "ADMIN",
      },
    });

    socketService.emit("trip:statusChanged", { requestId: activeRequest.id, status: "ADMIN_CHECKED_IN", driverId, checkInTime: checkin.checkInTime });

    await notificationService.create({
      recipientId: driverId,
      recipientRole: "driver",
      title: "Admin Check-In",
      message: `Admin has checked you in for vehicle ${data.vehiclePlate}.`,
      relatedRequestId: activeRequest.id,
    });

    return checkin;
  }

  async adminCheckOut(driverId: string, data: CheckOutDto) {
    const vehicle = await vehicleService.getByPlate(data.vehiclePlate);

    const checkin = await prisma.vehicleCheckin.findFirst({
      where: {
        driverId,
        vehicleId: vehicle.id,
        status: "CHECKED_IN",
      },
      include: { transportRequest: true },
    });

    if (!checkin) {
      throw createAppError(404, "NO_ACTIVE_CHECKIN", "No active check-in found for this driver");
    }

    const updated = await prisma.vehicleCheckin.update({
      where: { id: checkin.id },
      data: {
        checkOutLocation: data.location,
        checkOutTime: new Date(),
        checkOutRemark: data.remark,
        status: "CHECKED_OUT",
      },
    });

    socketService.emit("trip:statusChanged", { requestId: checkin.requestId, status: "ADMIN_CHECKED_OUT", driverId, checkOutTime: updated.checkOutTime });

    await notificationService.create({
      recipientId: driverId,
      recipientRole: "driver",
      title: "Admin Check-Out",
      message: `Admin has checked you out for vehicle ${data.vehiclePlate}.`,
      relatedRequestId: checkin.requestId,
    });

    return updated;
  }

  async startWaiting(requestId: string, userId: string) {
    const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (request.waitingStartedAt) {
      throw createAppError(400, "WAITING_ALREADY_STARTED", "Waiting is already in progress");
    }

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: { waitingStartedAt: new Date() },
    });

    socketService.emit("trip:statusChanged", { requestId, status: "WAITING_STARTED", driverId: request.driverId });

    return updated;
  }

  async stopWaiting(requestId: string, userId: string) {
    const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (!request.waitingStartedAt) {
      throw createAppError(400, "WAITING_NOT_STARTED", "No waiting period in progress");
    }

    const waitMs = Date.now() - request.waitingStartedAt.getTime();

    const updated = await prisma.transportRequest.update({
      where: { id: requestId },
      data: {
        waitingStartedAt: null,
        waitingTotalMs: request.waitingTotalMs + waitMs,
      },
    });

    socketService.emit("trip:statusChanged", { requestId, status: "WAITING_STOPPED", driverId: request.driverId });

    return updated;
  }

  private formatTripResponse(t: {
    id: string;
    passengerId: string;
    passenger: { user: { name: string } };
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
    feedback: { id: string; rating: number } | null;
    createdAt: Date;
  }, hasActiveCheckin: boolean) {
    return {
      id: t.id,
      passengerId: t.passengerId,
      passengerName: t.passenger?.user?.name || "",
      department: "",
      driverId: t.driverId,
      driverName: t.driver?.user?.name || null,
      vehicleId: t.vehicleId,
      vehiclePlate: t.vehicle?.plate || null,
      status: t.status,
      pickup: t.pickup,
      destination: t.destination,
      date: t.date.toISOString().split("T")[0],
      time: t.time,
      noOfPeople: t.noOfPeople || 1,
      wayUsers: t.wayUsers || null,
      section: t.section || null,
      serviceType: t.serviceType || null,
      purpose: t.purpose || null,
      returnTime: t.returnTime || null,
      note: t.note || null,
      qrScanStatus: ["QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"].includes(t.status)
        ? t.status
        : null,
      feedbackStatus: t.feedback ? "SUBMITTED" : null,
      createdAt: t.createdAt.toISOString(),
      hasActiveCheckin,
    };
  }
}

export const tripService = new TripService();
