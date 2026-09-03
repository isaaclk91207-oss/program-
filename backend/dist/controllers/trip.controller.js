"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripController = exports.TripController = void 0;
const trip_service_1 = require("../services/trip.service");
class TripController {
    async verifyQR(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await trip_service_1.tripService.verifyQR(req.body, req.user.id, req.user.role);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async pickupQRScan(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await trip_service_1.tripService.pickupQRScan(req.params.id, req.user.id);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async dropoffQRScan(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await trip_service_1.tripService.dropoffQRScan(req.params.id, req.user.id);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async driverCheckIn(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await trip_service_1.tripService.driverCheckIn(req.user.id, req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async driverCheckOut(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const result = await trip_service_1.tripService.driverCheckOut(req.user.id, req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getDriverTrips(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const { status } = req.query;
            const trips = await trip_service_1.tripService.getDriverTrips(req.user.id, status);
            res.json(trips);
        }
        catch (err) {
            next(err);
        }
    }
    async getPassengerTrips(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const { status } = req.query;
            const trips = await trip_service_1.tripService.getPassengerTrips(req.user.id, status);
            res.json(trips);
        }
        catch (err) {
            next(err);
        }
    }
    async getTripDetail(req, res, next) {
        try {
            const trip = await trip_service_1.tripService.getTripDetail(req.params.id);
            res.json(trip);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TripController = TripController;
exports.tripController = new TripController();
//# sourceMappingURL=trip.controller.js.map