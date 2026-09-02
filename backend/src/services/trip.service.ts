import { PrismaClient } from "@prisma/client";
import { createAppError } from "../middlewares/error.middleware";
import { QRScanPayload, QRVerificationResult, CheckInDto, CheckOutDto } from "../types";
import { transportService } from "./transport.service";
import { vehicleService } from "./vehicle.service";
import { notificationService } from "./notification.service";

const prisma = new PrismaClient();

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
      data: { status: "PICK_UP_SCANNED" },
    });

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
      data: { status: "DROP_OFF_SCANNED" },
    });

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
      },
    });

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

    if (checkin.transportRequest) {
      const currentStatus = checkin.transportRequest.status;
      if (currentStatus === "PICK_UP_SCANNED" || currentStatus === "QR_PENDING" || currentStatus === "ASSIGNED") {
        await prisma.transportRequest.update({
          where: { id: checkin.transportRequest.id },
          data: { status: "IN_PROGRESS" },
        });
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
        passenger: { include: { user: { select: { name: true, phone: true, email: true } } } },
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
      orderBy: { date: "desc" },
    });

    return trips;
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
        vehicle: true,
        feedback: { select: { id: true, rating: true } },
      },
      orderBy: { date: "desc" },
    });

    return trips;
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
}

export const tripService = new TripService();
