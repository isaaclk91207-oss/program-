import { PrismaClient } from "@prisma/client";
import { createAppError } from "../middlewares/error.middleware";
import { CreateFeedbackDto, FeedbackResponse } from "../types";
import { notificationService } from "./notification.service";

const prisma = new PrismaClient();

export class FeedbackService {
  async submit(requestId: string, passengerId: string, data: CreateFeedbackDto) {
    const request = await prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true } } } },
        vehicle: { select: { id: true, plate: true } },
      },
    });

    if (!request) {
      throw createAppError(404, "REQUEST_NOT_FOUND", "Transport request not found");
    }

    if (request.passengerId !== passengerId) {
      throw createAppError(403, "FORBIDDEN", "This request does not belong to you");
    }

    if (request.status !== "DROP_OFF_SCANNED") {
      throw createAppError(
        400,
        "INVALID_TRANSITION",
        `Cannot submit feedback for request in '${request.status}' status. Must be DROP_OFF_SCANNED.`
      );
    }

    if (!request.driverId || !request.vehicleId) {
      throw createAppError(400, "INCOMPLETE_ASSIGNMENT", "Request has no driver or vehicle assigned");
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { requestId },
    });

    if (existingFeedback) {
      throw createAppError(409, "FEEDBACK_EXISTS", "Feedback has already been submitted for this request");
    }

    if (data.rating < 1 || data.rating > 5) {
      throw createAppError(400, "INVALID_RATING", "Rating must be between 1 and 5");
    }

    if (!data.comment || data.comment.trim().length === 0) {
      throw createAppError(400, "COMMENT_REQUIRED", "Comment is required");
    }

    if (!data.tags || data.tags.length === 0) {
      throw createAppError(400, "TAGS_REQUIRED", "At least one tag is required");
    }

    const feedback = await prisma.feedback.create({
      data: {
        requestId,
        passengerId,
        driverId: request.driverId,
        vehicleId: request.vehicleId,
        rating: data.rating,
        comment: data.comment,
        tags: JSON.stringify(data.tags),
      },
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true } } } },
        vehicle: { select: { plate: true } },
        transportRequest: { select: { pickup: true, destination: true } },
      },
    });

    await prisma.transportRequest.update({
      where: { id: requestId },
      data: { status: "FEEDBACK_SUBMITTED" },
    });

    await notificationService.create({
      recipientId: "ADMIN",
      recipientRole: "admin",
      title: "Feedback Submitted",
      message: `${request.passenger.user.name} submitted ${data.rating}-star feedback for driver ${request.driver?.user?.name} on request ${requestId}.`,
      relatedRequestId: requestId,
    });

    return {
      id: feedback.id,
      requestId: feedback.requestId,
      passengerId: feedback.passengerId,
      passengerName: feedback.passenger.user.name,
      driverId: feedback.driverId,
      driverName: feedback.driver.user.name,
      vehicleId: feedback.vehicleId,
      vehiclePlate: feedback.vehicle.plate,
      rating: feedback.rating,
      comment: feedback.comment,
      tags: typeof feedback.tags === "string" ? JSON.parse(feedback.tags) : feedback.tags,
      department: "",
      date: feedback.createdAt.toISOString().split("T")[0],
    };
  }

  async getAll(filters?: { driverId?: string; rating?: number; search?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.driverId) {
      where.driverId = filters.driverId;
    }

    if (filters?.rating) {
      where.rating = filters.rating;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        passenger: { include: { user: { select: { name: true } } } },
        driver: { include: { user: { select: { name: true } } } },
        vehicle: { select: { plate: true } },
        transportRequest: { select: { id: true, pickup: true, destination: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return feedbacks.map((f) => ({
      id: f.id,
      requestId: f.requestId,
      passengerId: f.passengerId,
      passengerName: f.passenger.user.name,
      driverId: f.driverId,
      driverName: f.driver.user.name,
      vehicleId: f.vehicleId,
      vehiclePlate: f.vehicle.plate,
      rating: f.rating,
      comment: f.comment,
      tags: typeof f.tags === "string" ? JSON.parse(f.tags) : f.tags,
      department: "",
      date: f.createdAt.toISOString().split("T")[0],
    }));
  }

  async getByDriver(driverId: string) {
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

  async getDriverFeedbackStats(driverId: string) {
    const feedbacks = await prisma.feedback.findMany({
      where: { driverId },
      select: { rating: true },
    });

    if (feedbacks.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }

    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const average = Math.round((sum / feedbacks.length) * 10) / 10;
    const distribution: Record<number, number> = {};
    feedbacks.forEach((f) => {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    });

    return { average, count: feedbacks.length, distribution };
  }
}

export const feedbackService = new FeedbackService();
