"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleService = exports.VehicleService = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
class VehicleService {
    async getAll(filters) {
        const where = {};
        if (filters?.status && filters.status !== "ALL") {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                { plate: { contains: filters.search, mode: "insensitive" } },
                { make: { contains: filters.search, mode: "insensitive" } },
                { model: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        const vehicles = await prisma.vehicle.findMany({
            where,
            include: {
                driverProfiles: {
                    where: { status: "Active" },
                    take: 1,
                    include: { user: { select: { id: true, name: true } } },
                },
            },
            orderBy: { plate: "asc" },
        });
        return vehicles.map(this.formatResponse);
    }
    async getById(id) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                driverProfiles: {
                    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
                },
                transportRequests: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        passenger: { include: { user: { select: { name: true } } } },
                        driver: { include: { user: { select: { name: true } } } },
                    },
                },
                vehicleCheckins: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        driver: { include: { user: { select: { name: true } } } },
                        transportRequest: { select: { id: true } },
                    },
                },
            },
        });
        if (!vehicle) {
            throw (0, error_middleware_1.createAppError)(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
        }
        return vehicle;
    }
    async getByPlate(plate) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { plate },
            include: {
                driverProfiles: {
                    where: { status: "Active" },
                    take: 1,
                    include: { user: { select: { id: true, name: true } } },
                },
            },
        });
        if (!vehicle) {
            throw (0, error_middleware_1.createAppError)(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
        }
        return vehicle;
    }
    async create(data) {
        const existing = await prisma.vehicle.findUnique({
            where: { plate: data.plate },
        });
        if (existing) {
            throw (0, error_middleware_1.createAppError)(409, "VEHICLE_EXISTS", `Vehicle with plate ${data.plate} already exists`);
        }
        const vehicle = await prisma.vehicle.create({
            data: {
                plate: data.plate,
                qrValue: data.plate,
                make: data.make,
                model: data.model,
                year: data.year,
                color: data.color,
            },
        });
        return {
            id: vehicle.id,
            plate: vehicle.plate,
            qrValue: vehicle.qrValue,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            status: vehicle.status,
            assignedDriverId: null,
            assignedDriverName: null,
        };
    }
    async update(id, data) {
        const existing = await prisma.vehicle.findUnique({ where: { id } });
        if (!existing) {
            throw (0, error_middleware_1.createAppError)(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
        }
        const vehicle = await prisma.vehicle.update({
            where: { id },
            data,
            include: {
                driverProfiles: {
                    where: { status: "Active" },
                    take: 1,
                    include: { user: { select: { id: true, name: true } } },
                },
            },
        });
        return this.formatResponse(vehicle);
    }
    async findByQrValue(qrValue) {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qrValue },
            include: {
                driverProfiles: {
                    where: { status: "Active" },
                    take: 1,
                },
            },
        });
        return vehicle;
    }
    async delete(id) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            throw (0, error_middleware_1.createAppError)(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
        }
        const hasActiveTrips = await prisma.transportRequest.findFirst({
            where: { vehicleId: id, status: { notIn: ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"] } },
        });
        if (hasActiveTrips) {
            throw (0, error_middleware_1.createAppError)(409, "VEHICLE_HAS_ACTIVE_TRIPS", "Cannot delete vehicle with active transport requests");
        }
        const assignedDriver = await prisma.driverProfile.findFirst({
            where: { currentVehicleId: id },
        });
        if (assignedDriver) {
            throw (0, error_middleware_1.createAppError)(409, "VEHICLE_ASSIGNED", "Cannot delete vehicle that is assigned to a driver. Unassign first.");
        }
        await prisma.vehicle.delete({ where: { id } });
    }
    formatResponse(v) {
        const driver = v.driverProfiles?.[0];
        return {
            id: v.id,
            plate: v.plate,
            qrValue: v.qrValue,
            make: v.make,
            model: v.model,
            year: v.year,
            color: v.color,
            status: v.status,
            assignedDriverId: driver?.userId || null,
            assignedDriverName: driver?.user?.name || null,
        };
    }
}
exports.VehicleService = VehicleService;
exports.vehicleService = new VehicleService();
//# sourceMappingURL=vehicle.service.js.map