import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { config, DEFAULT_WEIGHTS, PRACTICAL_CRITERIA, OPERATIONAL_CRITERIA, PASS_MARKS } from "../config";
import { createAppError } from "../middlewares/error.middleware";
import { CreateDriverDto, UpdateDriverDto, DriverResponse, TripHoursEntry, CreateDriverTaskDto, DriverTaskResponse } from "../types";


function computeSectionScore(section: Record<string, number>, criteria: { key: string; weight: number }[]): number {
  if (!section || typeof section !== "object") return 0;
  return Math.round(
    criteria.reduce((sum, c) => sum + (Number(section[c.key]) || 0) * c.weight, 0) * 100
  ) / 100;
}

function feedbackTo100(avgRating: number): number {
  return Math.round(avgRating * 20 * 10) / 10;
}

function parseIfString<T>(val: T | string): T {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val as unknown as T; }
  }
  return val;
}

function computeOverallScore(assessment: {
  written: number;
  practical: Record<string, number> | number | string;
  operational: Record<string, number> | number | string;
  feedbackAvg: number;
  weights?: { written: number; practical: number; operational: number; feedback: number };
}): number {
  const w = assessment.weights || DEFAULT_WEIGHTS;
  const practical = parseIfString<Record<string, number> | number>(assessment.practical);
  const operational = parseIfString<Record<string, number> | number>(assessment.operational);
  const practicalScore =
    typeof practical === "object" && practical !== null
      ? computeSectionScore(practical, PRACTICAL_CRITERIA)
      : (practical as number) || 0;
  const operationalScore =
    typeof operational === "object" && operational !== null
      ? computeSectionScore(operational, OPERATIONAL_CRITERIA)
      : (operational as number) || 0;
  const feedback100 = feedbackTo100(assessment.feedbackAvg);

  const score =
    assessment.written * w.written +
    practicalScore * w.practical +
    operationalScore * w.operational +
    feedback100 * w.feedback;

  return Math.round(score * 100) / 100;
}

function getQualifiedLevel(score: number, passMarks?: Record<string, number>): string {
  const pm = passMarks || PASS_MARKS;
  const sorted = Object.entries(pm).sort((a, b) => b[1] - a[1]);
  for (const [level, threshold] of sorted) {
    if (score >= threshold) return level;
  }
  return "CD";
}

export class DriverService {
  async getAll(filters?: { status?: string; search?: string; certStatus?: string }): Promise<DriverResponse[]> {
    const where: Record<string, unknown> = {};

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

  async getById(id: string) {
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
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    return this.formatResponse(driver);
  }

  async create(data: CreateDriverDto): Promise<DriverResponse> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw createAppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: "DRIVER",
        driverProfile: {
          create: {
            certLevel: (data.certLevel as "CD" | "CC" | "CPC" | "CEC" | "CMC") || "CD",
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

    return this.formatResponse(user.driverProfile!);
  }

  async update(id: string, data: UpdateDriverDto): Promise<DriverResponse> {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: id } });
    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const updatedDriver = await prisma.driverProfile.update({
      where: { userId: id },
      data: {
        certLevel: data.certLevel as "CD" | "CC" | "CPC" | "CEC" | "CMC" | undefined,
        certStatus: data.certStatus as "PENDING" | "CERTIFIED" | "SUSPENDED" | "REVOKED" | undefined,
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

  async updateAssessment(
    driverId: string,
    data: { written: number; practical: Record<string, number>; operational: Record<string, number> }
  ) {
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      include: { feedbackRecords: { select: { rating: true } } },
    });

    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const feedbackAvg =
      driver.feedbackRecords.length > 0
        ? Math.round(
            (driver.feedbackRecords.reduce((sum, f) => sum + f.rating, 0) /
              driver.feedbackRecords.length) *
              10
          ) / 10
        : 0;

    const settings = await prisma.systemSettings.findFirst();
    const weights = settings
      ? { written: settings.writtenWeight, practical: settings.practicalWeight, operational: settings.operationalWeight, feedback: settings.feedbackWeight }
      : DEFAULT_WEIGHTS;
    const passMarks = settings?.passMarks ? JSON.parse(settings.passMarks) : PASS_MARKS;

    const practicalScore = computeSectionScore(data.practical, PRACTICAL_CRITERIA);
    const operationalScore = computeSectionScore(data.operational, OPERATIONAL_CRITERIA);
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
      data: { certLevel: certLevel as "CD" | "CC" | "CPC" | "CEC" | "CMC" },
    });

    return assessment;
  }

  async delete(id: string): Promise<void> {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: id } });
    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const hasActiveTrips = await prisma.transportRequest.findFirst({
      where: { driverId: id, status: { notIn: ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"] } },
    });
    if (hasActiveTrips) {
      throw createAppError(409, "DRIVER_HAS_ACTIVE_TRIPS", "Cannot delete driver with active transport requests");
    }

    await prisma.driverProfile.delete({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  }

  async getAllAssessments(filters?: { driverId?: string; certLevel?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.driverId) where.driverId = filters.driverId;
    if (filters?.certLevel) where.certLevel = filters.certLevel;

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

  async getPassengers(filters?: { search?: string }) {
    const where: Record<string, unknown> = {};
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

  async getFeedback(driverId: string) {
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
    const avgScore =
      drivers.reduce((sum, d) => {
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

  private formatResponse(d: {
    userId: string;
    user: { id: string; name: string; email: string; phone: string | null };
    certLevel: string;
    certStatus: string;
    validUntil: Date | null;
    status: string;
    joinedDate: Date;
    accidentFree: string | null;
    englishLevel: string | null;
    credits: number;
    currentVehicleId: string | null;
    currentVehicle?: { id: string; plate: string } | null;
    feedbackRecords?: { rating: number }[];
    assessments?: { overallScore: number }[];
  }): DriverResponse {
    const avgRating =
      d.feedbackRecords && d.feedbackRecords.length > 0
        ? Math.round(
            (d.feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / d.feedbackRecords.length) * 10
          ) / 10
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
  async getDrivingHours(driverId?: string) {
    const where: Record<string, unknown> = {};
    if (driverId) where.driverId = driverId;

    const [checkins, requests, tasks] = await Promise.all([
      prisma.vehicleCheckin.findMany({
        where,
        select: { driverId: true, checkInTime: true, checkOutTime: true, requestId: true },
      }),
      prisma.transportRequest.findMany({
        where: { ...where, pickedUpAt: { not: null } },
        select: { driverId: true, pickedUpAt: true, droppedOffAt: true, id: true, pickup: true, destination: true, date: true, waitingTotalMs: true },
      }),
      prisma.driverTask.findMany({
        where: driverId ? { driverId } : {},
        select: { driverId: true, startedAt: true, endedAt: true, status: true },
      }),
    ]);

    const drivingMap: Record<string, number> = {};
    for (const c of checkins) {
      if (!c.checkInTime || !c.checkOutTime) continue;
      const ms = c.checkOutTime.getTime() - c.checkInTime.getTime();
      if (ms <= 0) continue;
      drivingMap[c.driverId] = (drivingMap[c.driverId] || 0) + ms;
    }

    const tripMap: Record<string, { totalMs: number; tripCount: number; trips: TripHoursEntry[] }> = {};
    const waitingMap: Record<string, number> = {};
    for (const r of requests) {
      if (!r.pickedUpAt || !r.driverId) continue;
      const end = r.droppedOffAt || new Date();
      const ms = end.getTime() - r.pickedUpAt.getTime();
      if (ms > 0) {
        if (!tripMap[r.driverId]) tripMap[r.driverId] = { totalMs: 0, tripCount: 0, trips: [] };
        tripMap[r.driverId].totalMs += ms;
        tripMap[r.driverId].tripCount += 1;
      }
      waitingMap[r.driverId] = (waitingMap[r.driverId] || 0) + (r.waitingTotalMs || 0);
    }

    const taskMap: Record<string, number> = {};
    for (const t of tasks) {
      if (t.status !== "COMPLETED" || !t.endedAt) continue;
      const ms = t.endedAt.getTime() - t.startedAt.getTime();
      if (ms > 0) taskMap[t.driverId] = (taskMap[t.driverId] || 0) + ms;
    }

    const allDriverIds = new Set([
      ...Object.keys(drivingMap),
      ...Object.keys(tripMap),
      ...Object.keys(taskMap),
    ]);

    return Array.from(allDriverIds).map((id) => {
      const trip = tripMap[id] || { totalMs: 0, tripCount: 0, trips: [] };
      const allRequestIds = new Set(trip.trips.map(t => t.requestId));
      for (const r of requests) {
        if (r.driverId === id) allRequestIds.add(r.id);
      }

      const tripHoursEntries: TripHoursEntry[] = Array.from(allRequestIds).map((requestId) => {
        const r = requests.find(req => req.id === requestId);
        const tripMs = r ? (() => {
          if (!r.pickedUpAt) return 0;
          const end = r.droppedOffAt || new Date();
          const ms = end.getTime() - r.pickedUpAt.getTime();
          return ms > 0 ? ms : 0;
        })() : 0;
        return {
          requestId,
          tripDate: r?.date?.toISOString().split("T")[0] || "",
          route: r ? `${r.pickup} → ${r.destination}` : "",
          tripHours: Math.round((tripMs / 3600000) * 10) / 10,
          drivingHours: 0,
          waitingTimeMs: r?.waitingTotalMs || 0,
        };
      });

      return {
        driverId: id,
        tripHours: Math.round(((tripMap[id]?.totalMs || 0) / 3600000) * 10) / 10,
        tripCount: trip.tripCount,
        drivingHours: Math.round(((drivingMap[id] || 0) / 3600000) * 10) / 10,
        waitingTimeMs: waitingMap[id] || 0,
        taskHours: Math.round(((taskMap[id] || 0) / 3600000) * 10) / 10,
        trips: tripHoursEntries,
      };
    });
  }

  async createTask(driverId: string, data: CreateDriverTaskDto): Promise<DriverTaskResponse> {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: driverId } });
    if (!driver) {
      throw createAppError(404, "DRIVER_NOT_FOUND", "Driver not found");
    }

    const task = await prisma.driverTask.create({
      data: {
        driverId,
        title: data.title,
        description: data.description || null,
        estimatedDurationMs: data.estimatedDurationMs || null,
        startedAt: new Date(),
        status: "ACTIVE",
      },
    });

    return this.formatTaskResponse(task);
  }

  async getTasks(driverId: string): Promise<DriverTaskResponse[]> {
    const tasks = await prisma.driverTask.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((t) => this.formatTaskResponse(t));
  }

  async updateTask(driverId: string, taskId: string, data: { title?: string; description?: string; status?: string }): Promise<DriverTaskResponse> {
    const task = await prisma.driverTask.findFirst({ where: { id: taskId, driverId } });
    if (!task) {
      throw createAppError(404, "TASK_NOT_FOUND", "Task not found");
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status === "COMPLETED" && !task.endedAt) {
      updateData.endedAt = new Date();
      updateData.status = "COMPLETED";
    } else if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const updated = await prisma.driverTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return this.formatTaskResponse(updated);
  }

  async deleteTask(driverId: string, taskId: string): Promise<void> {
    const task = await prisma.driverTask.findFirst({ where: { id: taskId, driverId } });
    if (!task) {
      throw createAppError(404, "TASK_NOT_FOUND", "Task not found");
    }

    await prisma.driverTask.delete({ where: { id: taskId } });
  }

  private formatTaskResponse(t: {
    id: string;
    driverId: string;
    title: string;
    description: string | null;
    estimatedDurationMs: number | null;
    startedAt: Date;
    endedAt: Date | null;
    status: string;
    createdAt: Date;
  }): DriverTaskResponse {
    return {
      id: t.id,
      driverId: t.driverId,
      title: t.title,
      description: t.description,
      estimatedDurationMs: t.estimatedDurationMs || null,
      startedAt: t.startedAt.toISOString(),
      endedAt: t.endedAt?.toISOString() || null,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    };
  }
}

export const driverService = new DriverService();
