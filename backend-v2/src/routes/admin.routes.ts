import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { netprosService } from "../services/netpros.service";

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/admin/dashboard — Dashboard stats
router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const [vehicleCount, driverCount, requestCount, tripCount, ecoRecordCount] = await Promise.all([
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.transportRequest.count(),
      prisma.trip.count(),
      prisma.ecoDrivingRecord.count(),
    ]);

    const requestsByStatus = await prisma.transportRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    const activeVehicles = await prisma.vehicle.count({ where: { status: "ACTIVE" } });
    const availableDrivers = await prisma.driver.count({ where: { status: "AVAILABLE" } });

    res.json({
      totalVehicles: vehicleCount,
      activeVehicles,
      headOfficeVehicles: await prisma.vehicle.count({ where: { isHeadOffice: true } }),
      totalDrivers: driverCount,
      availableDrivers,
      totalRequests: requestCount,
      totalTrips: tripCount,
      totalEcoRecords: ecoRecordCount,
      requestsByStatus: requestsByStatus.map((s) => ({ status: s.status, count: s._count })),
    });
  } catch (err) {
    console.error("[Admin] Dashboard failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to load dashboard" } });
  }
});

// POST /api/v1/admin/netpros/sync — Trigger fleet trip sync
router.post("/netpros/sync", async (_req: Request, res: Response) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const sixHoursAgo = now - 6 * 60 * 60;
    const result = await netprosService.syncFleet();
    res.json(result);
  } catch (err) {
    console.error("[Admin] Netpros sync failed:", err);
    res.status(500).json({ error: { code: "SYNC_FAILED", message: "Failed to sync fleet data" } });
  }
});

// POST /api/v1/admin/netpros/eco-sync — Trigger Eco Driving sync
router.post("/netpros/eco-sync", async (req: Request, res: Response) => {
  try {
    const { timeFrom, timeTo } = req.body;

    // Default: last 24 hours
    const now = Math.floor(Date.now() / 1000);
    const from = timeFrom || now - 24 * 60 * 60;
    const to = timeTo || now;

    const result = await netprosService.syncHeadOfficeEcoScores(from, to);
    res.json(result);
  } catch (err) {
    console.error("[Admin] Eco sync failed:", err);
    res.status(500).json({ error: { code: "ECO_SYNC_FAILED", message: "Failed to sync Eco Driving data" } });
  }
});

// POST /api/v1/admin/netpros/trip-sync — Trigger Head Office trip sync (DrivingHourRecord)
router.post("/netpros/trip-sync", async (req: Request, res: Response) => {
  try {
    const { timeFrom, timeTo } = req.body;

    const now = Math.floor(Date.now() / 1000);
    const from = timeFrom || now - 24 * 60 * 60;
    const to = timeTo || now;

    const result = await netprosService.syncHeadOfficeTrips(from, to);
    res.json(result);
  } catch (err) {
    console.error("[Admin] Trip sync failed:", err);
    res.status(500).json({ error: { code: "TRIP_SYNC_FAILED", message: "Failed to sync trip data" } });
  }
});

// GET /api/v1/admin/netpros/status — Get sync status
router.get("/netpros/status", (_req: Request, res: Response) => {
  res.json(netprosService.getSyncStatus());
});

// GET /api/v1/admin/eco-driving — Get all eco driving records with filters
router.get("/eco-driving", async (req: Request, res: Response) => {
  try {
    const { driverId, from, to, violationType } = req.query;

    const where: Record<string, unknown> = {};

    if (driverId) {
      where.driverId = driverId;
    }

    if (violationType) {
      where.violationType = violationType;
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to as string);
    }

    const records = await prisma.ecoDrivingRecord.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, employeeId: true } },
        vehicle: { select: { id: true, plateNumber: true } },
      },
      orderBy: { date: "desc" },
      take: 500,
    });

    const violationTypes = [...new Set(records.map((r) => r.violationType))];

    const totalPenalties = records.reduce((sum, r) => sum + r.penaltyPoints, 0);
    const avgRank = records.length > 0
      ? Math.round((records.reduce((sum, r) => sum + r.rank, 0) / records.length) * 100) / 100
      : 10;

    const driverPenalties: Record<string, { name: string; employeeId: string; totalPenalties: number; violationCount: number }> = {};
    for (const r of records) {
      const key = r.driverId;
      if (!driverPenalties[key]) {
        driverPenalties[key] = {
          name: r.driver.name,
          employeeId: r.driver.employeeId,
          totalPenalties: 0,
          violationCount: 0,
        };
      }
      driverPenalties[key].totalPenalties += r.penaltyPoints;
      driverPenalties[key].violationCount++;
    }
    const topOffenders = Object.values(driverPenalties)
      .sort((a, b) => b.totalPenalties - a.totalPenalties)
      .slice(0, 5);

    res.json({
      records,
      violationTypes,
      summary: {
        totalRecords: records.length,
        totalPenalties,
        avgRank,
        topOffenders,
      },
    });
  } catch (err) {
    console.error("[Admin] Get eco driving failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch eco driving records" } });
  }
});

export default router;
