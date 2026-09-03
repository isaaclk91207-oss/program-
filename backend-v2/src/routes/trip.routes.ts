import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { QRScanDto } from "../types";

const prisma = new PrismaClient();
const router = Router();

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
