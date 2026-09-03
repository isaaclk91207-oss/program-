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

export default router;
