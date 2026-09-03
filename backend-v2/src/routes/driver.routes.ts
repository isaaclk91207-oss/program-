import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/drivers — List all drivers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        trips: { select: { id: true, status: true } },
      },
      orderBy: { employeeId: "asc" },
    });
    res.json(drivers);
  } catch (err) {
    console.error("[Driver] List failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list drivers" } });
  }
});

// GET /api/v1/drivers/:id — Get driver by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: { include: { request: true, vehicle: true } },
        ecoDrivingRecords: { orderBy: { date: "desc" }, take: 20 },
      },
    });
    if (!driver) {
      res.status(404).json({ error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
      return;
    }
    res.json(driver);
  } catch (err) {
    console.error("[Driver] Get failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get driver" } });
  }
});

// GET /api/v1/drivers/:id/driving-hours — Get driving hour records for a driver
router.get("/:id/driving-hours", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({ error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
      return;
    }

    const where: Record<string, unknown> = { driverId: id };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to as string);
    }

    const records = await prisma.drivingHourRecord.findMany({
      where,
      include: { vehicle: { select: { plateNumber: true } }, trip: { select: { id: true, status: true } } },
      orderBy: { date: "desc" },
    });

    const totalSeconds = records.reduce((sum, r) => sum + r.durationSeconds, 0);

    res.json({
      driver: { id: driver.id, name: driver.name, employeeId: driver.employeeId },
      records,
      summary: {
        totalRecords: records.length,
        totalDurationSeconds: totalSeconds,
        totalDurationHours: Math.round((totalSeconds / 3600) * 100) / 100,
      },
    });
  } catch (err) {
    console.error("[Driver] Get driving hours failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch driving hours" } });
  }
});

// GET /api/v1/drivers/:id/eco-driving — Get eco driving records for a driver
router.get("/:id/eco-driving", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      res.status(404).json({ error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
      return;
    }

    const where: Record<string, unknown> = { driverId: id };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to as string);
    }

    const records = await prisma.ecoDrivingRecord.findMany({
      where,
      include: { vehicle: { select: { plateNumber: true } } },
      orderBy: { date: "desc" },
    });

    // Aggregate by violation type
    const byViolation: Record<string, { count: number; totalPenalties: number; avgRank: number }> = {};
    for (const r of records) {
      if (!byViolation[r.violationType]) {
        byViolation[r.violationType] = { count: 0, totalPenalties: 0, avgRank: 0 };
      }
      byViolation[r.violationType].count++;
      byViolation[r.violationType].totalPenalties += r.penaltyPoints;
      byViolation[r.violationType].avgRank += r.rank;
    }
    for (const key of Object.keys(byViolation)) {
      byViolation[key].avgRank = Math.round((byViolation[key].avgRank / byViolation[key].count) * 100) / 100;
    }

    res.json({
      driver: {
        id: driver.id,
        name: driver.name,
        employeeId: driver.employeeId,
        ecoScore: driver.ecoScore,
        ecoPenalties: driver.ecoPenalties,
        lastEcoSync: driver.lastEcoSync?.toISOString(),
      },
      records,
      summary: {
        totalRecords: records.length,
        totalPenalties: records.reduce((sum, r) => sum + r.penaltyPoints, 0),
        avgRank: records.length > 0
          ? Math.round((records.reduce((sum, r) => sum + r.rank, 0) / records.length) * 100) / 100
          : 10,
        byViolation,
      },
    });
  } catch (err) {
    console.error("[Driver] Get eco driving failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch eco driving records" } });
  }
});

export default router;
