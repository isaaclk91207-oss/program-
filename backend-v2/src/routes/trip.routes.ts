import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { QRScanDto } from "../types";

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/trips/driver — Get trips for a driver (by driverId query param)
router.get("/driver", async (req: Request, res: Response) => {
  try {
    const { driverId, status } = req.query;

    if (!driverId || typeof driverId !== "string") {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "driverId query param is required" } });
      return;
    }

    const where: Record<string, unknown> = { driverId };
    if (status && typeof status === "string") {
      where.status = status;
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        request: true,
        vehicle: true,
        driver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format to match frontend TransportRequest type
    const formatted = trips.map((t) => ({
      id: t.request.id,
      requestNumber: t.request.requestNumber || null,
      passengerId: "",
      passengerName: t.request.passengerName,
      department: t.request.department,
      driverId: t.driverId,
      driverName: t.driver.name,
      vehicleId: t.vehicleId,
      vehiclePlate: t.vehicle.plateNumber,
      status: t.request.status,
      pickup: t.request.pickupLocation,
      destination: t.request.destination,
      date: t.request.requestDate.toISOString().split("T")[0],
      time: t.startTime ? t.startTime.toISOString().replace("T", " ").substring(11, 16) : "",
      qrScanStatus: t.status === "IN_PROGRESS" ? "PICK_UP_SCANNED" : null,
      feedbackStatus: null,
      createdAt: t.request.createdAt.toISOString(),
      tripId: t.id,
      tripStatus: t.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("[Trip] Get driver trips failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get driver trips" } });
  }
});

// POST /api/v1/trips/qr/scan — Verify QR code and transition trip status
router.post("/qr/scan", async (req: Request, res: Response) => {
  try {
    const { tripId, qrPayload, eventType }: QRScanDto = req.body;

    if (!tripId || !qrPayload || !eventType) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Missing required fields: tripId, qrPayload, eventType" },
      });
      return;
    }

    if (eventType !== "PICKUP" && eventType !== "DROPOFF") {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "eventType must be PICKUP or DROPOFF" },
      });
      return;
    }

    // Find trip with related data
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, request: true },
    });

    if (!trip) {
      res.status(404).json({ error: { code: "TRIP_NOT_FOUND", message: "Trip not found" } });
      return;
    }

    // Verify QR payload matches vehicle plate
    if (trip.vehicle.plateNumber !== qrPayload) {
      res.status(400).json({
        error: { code: "QR_MISMATCH", message: `QR payload '${qrPayload}' does not match vehicle '${trip.vehicle.plateNumber}'` },
      });
      return;
    }

    // State machine transitions
    const now = new Date();
    let updatedTrip;

    if (eventType === "PICKUP") {
      // PICKUP: PENDING → IN_PROGRESS (or QR_PENDING → IN_PROGRESS)
      if (trip.status !== "PENDING" && trip.status !== "IN_PROGRESS") {
        res.status(400).json({
          error: {
            code: "INVALID_TRANSITION",
            message: `Cannot scan PICKUP for trip in '${trip.status}' status. Expected PENDING or IN_PROGRESS.`,
          },
        });
        return;
      }

      updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          status: "IN_PROGRESS",
          startTime: now,
        },
      });

      // Update request status
      await prisma.transportRequest.update({
        where: { id: trip.requestId },
        data: { status: "IN_PROGRESS" },
      });

      // Update vehicle status
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "IN_USE" },
      });
    } else {
      // DROPOFF: IN_PROGRESS → COMPLETED
      if (trip.status !== "IN_PROGRESS") {
        res.status(400).json({
          error: {
            code: "INVALID_TRANSITION",
            message: `Cannot scan DROPOFF for trip in '${trip.status}' status. Expected IN_PROGRESS.`,
          },
        });
        return;
      }

      updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          endTime: now,
        },
      });

      // Update request status
      await prisma.transportRequest.update({
        where: { id: trip.requestId },
        data: { status: "DROPOFF_COMPLETE" },
      });

      // Update vehicle and driver status
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ACTIVE" },
      });

      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });
    }

    res.json({
      success: true,
      message: `${eventType} scan recorded successfully`,
      trip: {
        id: updatedTrip.id,
        status: updatedTrip.status,
        startTime: updatedTrip.startTime?.toISOString(),
        endTime: updatedTrip.endTime?.toISOString(),
      },
    });
  } catch (err) {
    console.error("[Trip] QR scan failed:", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to process QR scan" } });
  }
});

export default router;
