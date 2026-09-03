import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/vehicles — List all vehicles
router.get("/", async (_req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: { select: { id: true, status: true, driver: { select: { name: true, employeeId: true } } } },
        ecoDrivingRecords: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: { plateNumber: "asc" },
    });
    res.json(vehicles);
  } catch (err) {
    console.error("[Vehicle] List failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list vehicles" } });
  }
});

// GET /api/v1/vehicles/:id — Get vehicle by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: { include: { request: true, driver: true }, orderBy: { createdAt: "desc" }, take: 10 },
        ecoDrivingRecords: { orderBy: { date: "desc" }, take: 20 },
        drivingHours: { orderBy: { date: "desc" }, take: 20 },
      },
    });
    if (!vehicle) {
      res.status(404).json({ error: { code: "VEHICLE_NOT_FOUND", message: "Vehicle not found" } });
      return;
    }
    res.json(vehicle);
  } catch (err) {
    console.error("[Vehicle] Get failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get vehicle" } });
  }
});

export default router;
