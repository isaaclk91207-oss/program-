"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverService = exports.DriverService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../config");
const error_middleware_1 = require("../middlewares/error.middleware");
const prisma = new client_1.PrismaClient();
function computeSectionScore(section, criteria) {
    if (!section || typeof section !== "object")
        return 0;
    return Math.round(criteria.reduce((sum, c) => sum + (Number(section[c.key]) || 0) * c.weight, 0) * 100) / 100;
}
function feedbackTo100(avgRating) {
    return Math.round(avgRating * 20 * 10) / 10;
}
function parseIfString(val) {
    if (typeof val === "string") {
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    return val;
}
function computeOverallScore(assessment) {
    const w = assessment.weights || config_1.DEFAULT_WEIGHTS;
    const practical = parseIfString(assessment.practical);
    const operational = parseIfString(assessment.operational);
    const practicalScore = typeof practical === "object" && practical !== null
        ? computeSectionScore(practical, config_1.PRACTICAL_CRITERIA)
        : practical || 0;
    const operationalScore = typeof operational === "object" && operational !== null
        ? computeSectionScore(operational, config_1.OPERATIONAL_CRITERIA)
        : operational || 0;
    const feedback100 = feedbackTo100(assessment.feedbackAvg);
    const score = assessment.written * w.written +
        practicalScore * w.practical +
        operationalScore * w.operational +
        feedback100 * w.feedback;
    return Math.round(score * 100) / 100;
}
function getQualifiedLevel(score, passMarks) {
    const pm = passMarks || config_1.PASS_MARKS;
    const sorted = Object.entries(pm).sort((a, b) => b[1] - a[1]);
    for (const [level, threshold] of sorted) {
        if (score >= threshold)
            return level;
    }
    return "CD";
}
class DriverService {
    async getAll(filters) {
        const where = {};
        if (filters?.status && filters.status !== "ALL") {
            where.status = filters.status;
        }
        if (filters?.certStatus && filters.certStatus !== "ALL") {
            where.certStatus = filters.certStatus;
        }
        if (filters?.search) {
            where.OR = [
                { user: { name: { contains: filters.search, mode: "insensitive" } } },
                { user: { email: { contains: filters.search, mode: "insensitive" } } },
                { userId: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        const drivers = await prisma.driverProfile.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                currentVehicle: true,
                assessments: { orderBy: { createdAt: "desc" }, take: 1 },
                feedbackRecords: { select: { rating: true } },
            },
            orderBy: { user: { name: "asc" } },
        });
        return drivers.map((d) => this.formatResponse(d));
    }
    async getById(id) {
        const driver = await prisma.driverProfile.findUnique({
            where: { userId: id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
                currentVehicle: true,
                assessments: { orderBy: { createdAt: "desc" } },
                feedbackRecords: {
                    include: {
                        transportRequest: { select: { id: true, pickup: true, destination: true } },
                        passenger: { include: { user: { select: { name: true } } } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                vehicleCheckins: {
                    include: { vehicle: { select: { plate: true } } },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!driver) {
            throw (0, error_middleware_1.createAppError)(404, "DRIVER_NOT_FOUND", "Driver not found");
        }
        return this.formatResponse(driver);
    }
    async create(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw (0, error_middleware_1.createAppError)(409, "USER_EXISTS", "A user with this email already exists");
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, config_1.config.bcryptSaltRounds);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: "DRIVER",
                driverProfile: {
                    create: {
                        certLevel: data.certLevel || "CD",
                        licenseNo: data.licenseNo,
                        englishLevel: data.englishLevel,
                    },
                },
            },
            include: {
                driverProfile: {
                    include: {
                        user: { select: { id: true, name: true, email: true, phone: true } },
                        currentVehicle: true,
                        feedbackRecords: { select: { rating: true } },
                        assessments: { orderBy: { createdAt: "desc" }, take: 1 },
                    },
                },
            },
        });
        return this.formatResponse(user.driverProfile);
    }
    async update(id, data) {
        const driver = await prisma.driverProfile.findUnique({ where: { userId: id } });
        if (!driver) {
            throw (0, error_middleware_1.createAppError)(404, "DRIVER_NOT_FOUND", "Driver not found");
        }
        const updatedDriver = await prisma.driverProfile.update({
            where: { userId: id },
            data: {
                certLevel: data.certLevel,
                certStatus: data.certStatus,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                status: data.status,
                englishLevel: data.englishLevel,
                accidentFree: data.accidentFree,
                credits: data.credits,
                currentVehicleId: data.currentVehicleId,
            },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                currentVehicle: true,
                feedbackRecords: { select: { rating: true } },
                assessments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
        });
        return this.formatResponse(updatedDriver);
    }
    async updateAssessment(driverId, data) {
        const driver = await prisma.driverProfile.findUnique({
            where: { userId: driverId },
            include: { feedbackRecords: { select: { rating: true } } },
        });
        if (!driver) {
            throw (0, error_middleware_1.createAppError)(404, "DRIVER_NOT_FOUND", "Driver not found");
        }
        const feedbackAvg = driver.feedbackRecords.length > 0
            ? Math.round((driver.feedbackRecords.reduce((sum, f) => sum + f.rating, 0) /
                driver.feedbackRecords.length) *
                10) / 10
            : 0;
        const settings = await prisma.systemSettings.findFirst();
        const weights = settings
            ? { written: settings.writtenWeight, practical: settings.practicalWeight, operational: settings.operationalWeight, feedback: settings.feedbackWeight }
            : config_1.DEFAULT_WEIGHTS;
        const passMarks = settings?.passMarks ? JSON.parse(settings.passMarks) : config_1.PASS_MARKS;
        const practicalScore = computeSectionScore(data.practical, config_1.PRACTICAL_CRITERIA);
        const operationalScore = computeSectionScore(data.operational, config_1.OPERATIONAL_CRITERIA);
        const overallScore = computeOverallScore({
            written: data.written,
            practical: data.practical,
            operational: data.operational,
            feedbackAvg,
            weights,
        });
        const certLevel = getQualifiedLevel(overallScore, passMarks);
        const assessment = await prisma.assessment.create({
            data: {
                driverId,
                written: data.written,
                practical: JSON.stringify(data.practical),
                operational: JSON.stringify(data.operational),
                feedbackAvg,
                overallScore,
                certLevel: certLevel,
            },
        });
        await prisma.driverProfile.update({
            where: { userId: driverId },
            data: { certLevel: certLevel },
        });
        return assessment;
    }
    async delete(id) {
        const driver = await prisma.driverProfile.findUnique({ where: { userId: id } });
        if (!driver) {
            throw (0, error_middleware_1.createAppError)(404, "DRIVER_NOT_FOUND", "Driver not found");
        }
        const hasActiveTrips = await prisma.transportRequest.findFirst({
            where: { driverId: id, status: { notIn: ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"] } },
        });
        if (hasActiveTrips) {
            throw (0, error_middleware_1.createAppError)(409, "DRIVER_HAS_ACTIVE_TRIPS", "Cannot delete driver with active transport requests");
        }
        await prisma.driverProfile.delete({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
    }
    async getAllAssessments(filters) {
        const where = {};
        if (filters?.driverId)
            where.driverId = filters.driverId;
        if (filters?.certLevel)
            where.certLevel = filters.certLevel;
        const assessments = await prisma.assessment.findMany({
            where,
            include: {
                driver: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return assessments.map((a) => ({
            id: a.id,
            driverId: a.driverId,
            driverName: a.driver.user.name,
            driverEmail: a.driver.user.email,
            written: a.written,
            practical: parseIfString(a.practical),
            operational: parseIfString(a.operational),
            feedbackAvg: a.feedbackAvg,
            overallScore: a.overallScore,
            certLevel: a.certLevel,
            createdAt: a.createdAt.toISOString(),
        }));
    }
    async getPassengers(filters) {
        const where = {};
        if (filters?.search) {
            where.OR = [
                { user: { name: { contains: filters.search, mode: "insensitive" } } },
                { user: { email: { contains: filters.search, mode: "insensitive" } } },
            ];
        }
        const passengers = await prisma.passengerProfile.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                transportRequests: { select: { id: true, status: true } },
            },
            orderBy: { user: { name: "asc" } },
        });
        return passengers.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            email: p.user.email,
            phone: p.user.phone,
            department: p.department,
            totalRequests: p.transportRequests.length,
            completedRequests: p.transportRequests.filter((r) => r.status === "FEEDBACK_SUBMITTED").length,
        }));
    }
    async getFeedback(driverId) {
        const feedbacks = await prisma.feedback.findMany({
            where: { driverId },
            include: {
                passenger: { include: { user: { select: { name: true } } } },
                vehicle: { select: { plate: true } },
                transportRequest: { select: { id: true, pickup: true, destination: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return feedbacks;
    }
    async getCertificationSummary() {
        const drivers = await prisma.driverProfile.findMany({
            include: {
                user: { select: { name: true } },
                feedbackRecords: { select: { rating: true } },
                assessments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
        });
        const total = drivers.length;
        const certified = drivers.filter((d) => d.certStatus === "CERTIFIED").length;
        const pending = drivers.filter((d) => d.certStatus === "PENDING").length;
        const avgScore = drivers.reduce((sum, d) => {
            const score = d.assessments[0]?.overallScore || 0;
            return sum + score;
        }, 0) / (total || 1);
        const byLevel = ["CD", "CC", "CPC", "CEC", "CMC"].map((level) => ({
            level,
            count: drivers.filter((d) => d.certLevel === level).length,
        }));
        const topPerformers = drivers
            .map((d) => ({
            id: d.userId,
            name: d.user.name,
            score: d.assessments[0]?.overallScore || 0,
            level: d.certLevel,
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        return { total, certified, pending, avgScore, byLevel, topPerformers };
    }
    formatResponse(d) {
        const avgRating = d.feedbackRecords && d.feedbackRecords.length > 0
            ? Math.round((d.feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / d.feedbackRecords.length) * 10) / 10
            : 0;
        return {
            id: d.userId,
            name: d.user.name,
            email: d.user.email,
            phone: d.user.phone,
            certLevel: d.certLevel,
            certStatus: d.certStatus,
            validUntil: d.validUntil?.toISOString() || null,
            status: d.status,
            joinedDate: d.joinedDate.toISOString(),
            accidentFree: d.accidentFree,
            englishLevel: d.englishLevel,
            credits: d.credits,
            currentVehicleId: d.currentVehicleId,
            currentVehiclePlate: d.currentVehicle?.plate || null,
            score: d.assessments?.[0]?.overallScore || 0,
            rating: avgRating,
        };
    }
}
exports.DriverService = DriverService;
exports.driverService = new DriverService();
//# sourceMappingURL=driver.service.js.map