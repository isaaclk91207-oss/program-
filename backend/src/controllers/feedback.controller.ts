import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { feedbackService } from "../services/feedback.service";

export class FeedbackController {
  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
      }
      const result = await feedbackService.submit(req.params.id, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { driverId, rating, search } = req.query;
      const feedbacks = await feedbackService.getAll({
        driverId: driverId as string,
        rating: rating ? Number(rating) : undefined,
        search: search as string,
      });
      res.json(feedbacks);
    } catch (err) {
      next(err);
    }
  }

  async getByDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const feedbacks = await feedbackService.getByDriver(req.params.driverId);
      res.json(feedbacks);
    } catch (err) {
      next(err);
    }
  }

  async getDriverStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await feedbackService.getDriverFeedbackStats(req.params.driverId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}

export const feedbackController = new FeedbackController();
