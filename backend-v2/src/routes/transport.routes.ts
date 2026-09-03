import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/transport-requests — List all transport requests
router.get("/", async (_req: Request, res: Response) => {
  try {
    const requests = await prisma.transportRequest.findMany({
      include: { trip: { include: { driver: true, vehicle: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (err) {
    console.error("[Transport] List failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list transport requests" } });
  }
});

// GET /api/v1/transport-requests/:id — Get transport request by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await prisma.transportRequest.findUnique({
      where: { id },
      include: { trip: { include: { driver: true, vehicle: true } } },
    });
    if (!request) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Transport request not found" } });
      return;
    }
    res.json(request);
  } catch (err) {
    console.error("[Transport] Get failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get transport request" } });
  }
});

// POST /api/v1/transport-requests — Create a new transport request
router.post("/", async (req: Request, res: Response) => {
  try {
    const { passengerName, department, pickupLocation, destination, requestDate } = req.body;

    if (!passengerName || !department || !pickupLocation || !destination || !requestDate) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Missing required fields: passengerName, department, pickupLocation, destination, requestDate" },
      });
      return;
    }

    const request = await prisma.transportRequest.create({
      data: {
        passengerName,
        department,
        pickupLocation,
        destination,
        requestDate: new Date(requestDate),
        status: "PENDING",
      },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error("[Transport] Create failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create transport request" } });
  }
});

// POST /api/v1/transport-requests/:id/assign — Assign driver and vehicle
router.post("/:id/assign", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId, vehicleId } = req.body;

    if (!driverId || !vehicleId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Missing required fields: driverId, vehicleId" },
      });
      return;
    }

    // Validate request exists and is PENDING
    const existing = await prisma.transportRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Transport request not found" } });
      return;
    }
    if (existing.status !== "PENDING") {
      res.status(400).json({
        error: { code: "INVALID_TRANSITION", message: `Cannot assign to request in '${existing.status}' status. Must be PENDING.` },
      });
      return;
    }

    // Validate driver and vehicle exist
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      res.status(404).json({ error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(404).json({ error: { code: "VEHICLE_NOT_FOUND", message: "Vehicle not found" } });
      return;
    }

    // Update request status and create trip
    const [updatedRequest, trip] = await prisma.$transaction([
      prisma.transportRequest.update({
        where: { id },
        data: { status: "ASSIGNED" },
      }),
      prisma.trip.create({
        data: {
          requestId: id,
          driverId,
          vehicleId,
          status: "PENDING",
        },
      }),
    ]);

    // Update driver status
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: "ON_TRIP" },
    });

    res.json({ request: updatedRequest, trip });
  } catch (err) {
    console.error("[Transport] Assign failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to assign driver" } });
  }
});

export default router;
