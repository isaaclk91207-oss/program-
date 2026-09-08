"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportService = exports.TransportService = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middlewares/error.middleware");
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
class TransportService {
    async getAll(filters, page = 1, limit = 50) {
        const where = {};
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
    async getById(id) {
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
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        return request;
    }
    async create(data) {
        const passenger = await prisma.passengerProfile.findUnique({
            where: { userId: data.passengerId },
            include: { user: { select: { name: true } } },
        });
        if (!passenger) {
            throw (0, error_middleware_1.createAppError)(404, "PASSENGER_NOT_FOUND", "Passenger not found");
        }
        const request = await prisma.transportRequest.create({
            data: {
                passengerId: data.passengerId,
                pickup: data.pickup,
                destination: data.destination,
                date: new Date(data.date),
                time: data.time,
                status: "PENDING",
            },
            include: {
                passenger: { include: { user: { select: { name: true } } } },
            },
        });
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        await notification_service_1.notificationService.create({
            recipientId: admin?.id ?? "admin-system",
            recipientRole: "ADMIN",
            title: "New Transport Request",
            message: `${passenger.user.name} (${passenger.userId}) requested transport from ${data.pickup} to ${data.destination} on ${data.date} at ${data.time}.`,
            relatedRequestId: request.id,
        });
        return this.formatResponse({
            ...request,
            driver: null,
            vehicle: null,
            feedback: null,
        });
    }
    async assignDriver(requestId, data) {
        const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        if (request.status !== "PENDING") {
            throw (0, error_middleware_1.createAppError)(400, "INVALID_TRANSITION", `Cannot assign driver to request in '${request.status}' status. Must be PENDING.`);
        }
        const driver = await prisma.driverProfile.findUnique({
            where: { userId: data.driverId },
            include: { user: { select: { name: true } } },
        });
        if (!driver) {
            throw (0, error_middleware_1.createAppError)(404, "DRIVER_NOT_FOUND", "Driver not found");
        }
        const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
        if (!vehicle) {
            throw (0, error_middleware_1.createAppError)(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
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
                driver: { include: { user: { select: { name: true } } } },
                vehicle: true,
            },
        });
        const passenger = await prisma.passengerProfile.findUnique({
            where: { userId: request.passengerId },
            include: { user: { select: { name: true } } },
        });
        await Promise.all([
            notification_service_1.notificationService.create({
                recipientId: request.passengerId,
                recipientRole: "PASSENGER",
                title: "Transport Request Assigned",
                message: `Your transport request ${requestId} has been assigned to Driver ${driver.user.name} with vehicle ${vehicle.plate}.`,
                relatedRequestId: requestId,
            }),
            notification_service_1.notificationService.create({
                recipientId: data.driverId,
                recipientRole: "DRIVER",
                title: "New Transport Assigned",
                message: `You have been assigned transport request ${requestId} for ${passenger?.user?.name || "a passenger"} from ${request.pickup} to ${request.destination}.`,
                relatedRequestId: requestId,
            }),
        ]);
        return this.formatResponse(updated);
    }
    async transitionStatus(requestId, newStatus) {
        const request = await prisma.transportRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw (0, error_middleware_1.createAppError)(404, "REQUEST_NOT_FOUND", "Transport request not found");
        }
        const validNext = VALID_TRANSITIONS[request.status];
        if (!validNext || !validNext.includes(newStatus)) {
            throw (0, error_middleware_1.createAppError)(400, "INVALID_TRANSITION", `Cannot transition from '${request.status}' to '${newStatus}'. Valid transitions: ${validNext?.join(", ") || "none"}`);
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
    formatResponse(r) {
        return {
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
            qrScanStatus: ["QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"].includes(r.status)
                ? r.status
                : null,
            feedbackStatus: r.feedback ? "SUBMITTED" : null,
            createdAt: r.createdAt.toISOString(),
        };
    }
}
exports.TransportService = TransportService;
exports.transportService = new TransportService();
//# sourceMappingURL=transport.service.js.map