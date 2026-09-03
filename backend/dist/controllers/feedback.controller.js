"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackController = exports.FeedbackController = void 0;
const feedback_service_1 = require("../services/feedback.service");
class FeedbackController {
    async submit(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await feedback_service_1.feedbackService.submit(req.params.id, req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getAll(req, res, next) {
        try {
            const { driverId, rating, search } = req.query;
            const feedbacks = await feedback_service_1.feedbackService.getAll({
                driverId: driverId,
                rating: rating ? Number(rating) : undefined,
                search: search,
            });
            res.json(feedbacks);
        }
        catch (err) {
            next(err);
        }
    }
    async getByDriver(req, res, next) {
        try {
            const feedbacks = await feedback_service_1.feedbackService.getByDriver(req.params.driverId);
            res.json(feedbacks);
        }
        catch (err) {
            next(err);
        }
    }
    async getDriverStats(req, res, next) {
        try {
            const stats = await feedback_service_1.feedbackService.getDriverFeedbackStats(req.params.driverId);
            res.json(stats);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FeedbackController = FeedbackController;
exports.feedbackController = new FeedbackController();
//# sourceMappingURL=feedback.controller.js.map