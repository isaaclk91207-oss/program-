import { Router, Request, Response, NextFunction } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/dashboard", adminController.getDashboard);
router.get("/gps/live", adminController.getLiveLocations);
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);
router.get("/export/:type", adminController.exportData);
router.get("/netpros/status", adminController.getNetprosStatus);
router.post("/netpros/sync", adminController.triggerNetprosSync);
router.post("/netpros/eco-sync", adminController.triggerEcoSync);

// GET /api/v1/admin/eco-driving — Get all eco driving records with filters
router.get("/eco-driving", async (req: Request, res: Response, next: NextFunction) => {
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
        driver: { select: { userId: true, user: { select: { id: true, name: true } } } },
        vehicle: { select: { id: true, plate: true } },
      },
      orderBy: { date: "desc" },
      take: 500,
    });

    // Map records to frontend format
    const mappedRecords = records.map((r) => ({
      id: r.id,
      violationType: r.violationType,
      penaltyPoints: r.penaltyPoints,
      rank: r.rank,
      date: r.date.toISOString(),
      driver: {
        id: r.driverId,
        name: r.driver.user?.name || "Unknown",
        employeeId: r.driverId,
      },
      vehicle: {
        id: r.vehicleId,
        plateNumber: r.vehicle.plate,
      },
    }));

    const violationTypes = [...new Set(mappedRecords.map((r) => r.violationType))];

    const totalPenalties = mappedRecords.reduce((sum, r) => sum + r.penaltyPoints, 0);
    const avgRank = mappedRecords.length > 0
      ? Math.round((mappedRecords.reduce((sum, r) => sum + r.rank, 0) / mappedRecords.length) * 100) / 100
      : 10;

    const driverPenalties: Record<string, { name: string; employeeId: string; totalPenalties: number; violationCount: number }> = {};
    for (const r of mappedRecords) {
      const key = r.driver.id;
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
      records: mappedRecords,
      violationTypes,
      summary: {
        totalRecords: mappedRecords.length,
        totalPenalties,
        avgRank,
        topOffenders,
      },
    });
  } catch (err) {
    console.error("[Admin] Get eco driving failed:", err);
    next(err);
  }
});

export default router;
