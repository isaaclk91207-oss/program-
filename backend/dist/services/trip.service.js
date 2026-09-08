"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripService = exports.TripService = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middlewares/error.middleware");
const vehicle_service_1 = require("./vehicle.service");
const notification_service_1 = require("./notification.service");
const prisma = new client_1.PrismaClient();
const VALID_TRANSITIONS = {
    PENDING: ["ASSIGNED"],
    ASSIGNED: ["QR_PENDING"],
    QR_PENDING: ["PICK_UP_SCANNED"],
    PICK_UP_SCANNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["DROP_OFF_SCANNED"],
    DROP_OFF_SCANNED: ["FEEDBACK_SUBMITTED"],
    FEEDBACK_SUBMITTED: [],
};
class TripService {
    async verifyQR(payload, userId, role) {
        const vehicle = await vehicle_service_1.vehicleService.findByQrValue(payload.qrValue);
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
    async pickupQRScan(requestId, userId) {
        const request = await prisma.transportRequest.findUnique({
            where: { id: requestId },
            include: { vehicle: true },
        });
        if (!request) {
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        if (request.passengerId !== userId) {
            throw (0, error_middleware_1.createAppError)(403, "FORBIDDEN", "This request does not belong to you");
        }
        if (request.status !== "QR_PENDING" && request.status !== "ASSIGNED") {
            throw (0, error_middleware_1.createAppError)(400, "INVALID_TRANSITION", `Cannot scan pickup QR for request in '${request.status}' status`);
        }
        const updated = await prisma.transportRequest.update({
            where: { id: requestId },
            data: { status: "PICK_UP_SCANNED" },
        });
        return updated;
    }
    async dropoffQRScan(requestId, userId) {
        const request = await prisma.transportRequest.findUnique({
            where: { id: requestId },
            include: { vehicle: true },
        });
        if (!request) {
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        if (request.passengerId !== userId) {
            throw (0, error_middleware_1.createAppError)(403, "FORBIDDEN", "This request does not belong to you");
        }
        if (request.status !== "IN_PROGRESS" && request.status !== "PICK_UP_SCANNED") {
            throw (0, error_middleware_1.createAppError)(400, "INVALID_TRANSITION", `Cannot scan dropoff QR for request in '${request.status}' status`);
        }
        const updated = await prisma.transportRequest.update({
            where: { id: requestId },
            data: { status: "DROP_OFF_SCANNED" },
        });
        return updated;
    }
    async driverCheckIn(driverId, data) {
        const vehicle = await vehicle_service_1.vehicleService.getByPlate(data.vehiclePlate);
        const activeRequest = await prisma.transportRequest.findFirst({
            where: {
                driverId,
                vehicleId: vehicle.id,
                status: { in: ["ASSIGNED", "QR_PENDING"] },
            },
        });
        if (!activeRequest) {
            throw (0, error_middleware_1.createAppError)(400, "NO_ACTIVE_TRIP", "No active trip found for this driver and vehicle combination");
        }
        const existingCheckin = await prisma.vehicleCheckin.findFirst({
            where: {
                driverId,
                requestId: activeRequest.id,
                status: "CHECKED_IN",
            },
        });
        if (existingCheckin) {
            throw (0, error_middleware_1.createAppError)(400, "ALREADY_CHECKED_IN", "Already checked in for this trip");
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
        await notification_service_1.notificationService.create({
            recipientId: driverId,
            recipientRole: "driver",
            title: "Check-In Recorded",
            message: `Your check-in for vehicle ${data.vehiclePlate} has been recorded successfully.`,
            relatedRequestId: activeRequest.id,
        });
        return checkin;
    }
    async driverCheckOut(driverId, data) {
        const vehicle = await vehicle_service_1.vehicleService.getByPlate(data.vehiclePlate);
        const checkin = await prisma.vehicleCheckin.findFirst({
            where: {
                driverId,
                vehicleId: vehicle.id,
                status: "CHECKED_IN",
            },
            include: { transportRequest: true },
        });
        if (!checkin) {
            throw (0, error_middleware_1.createAppError)(404, "NO_ACTIVE_CHECKIN", "No active check-in found for this vehicle");
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
        await notification_service_1.notificationService.create({
            recipientId: driverId,
            recipientRole: "driver",
            title: "Check-Out Recorded",
            message: `Your check-out for vehicle ${data.vehiclePlate} has been recorded successfully.`,
            relatedRequestId: checkin.requestId,
        });
        return updated;
    }
    async getDriverTrips(driverId, status) {
        const where = { driverId };
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
        return trips.map(this.formatTripResponse);
    }
    async getPassengerTrips(passengerId, status) {
        const where = { passengerId };
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
        return trips.map(this.formatTripResponse);
    }
    async getTripDetail(requestId) {
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
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        return request;
    }
    formatTripResponse(t) {
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
            qrScanStatus: ["QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"].includes(t.status)
                ? t.status
                : null,
            feedbackStatus: t.feedback ? "SUBMITTED" : null,
            createdAt: t.createdAt.toISOString(),
        };
    }
}
exports.TripService = TripService;
exports.tripService = new TripService();
//# sourceMappingURL=trip.service.js.map