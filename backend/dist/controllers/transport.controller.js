"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportController = exports.TransportController = void 0;
const transport_service_1 = require("../services/transport.service");
class TransportController {
    async getAll(req, res, next) {
        try {
            const { status, search, page, limit } = req.query;
            const result = await transport_service_1.transportService.getAll({
                status: status,
                search: search,
                role: req.user?.role,
                userId: req.user?.id,
            }, Number(page) || 1, Number(limit) || 50);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const request = await transport_service_1.transportService.getById(req.params.id);
            res.json(request);
        }
        catch (err) {
            next(err);
        }
    }
    async create(req, res, next) {
        try {
            const result = await transport_service_1.transportService.create({
                ...req.body,
                passengerId: req.user?.id,
            });
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async assignDriver(req, res, next) {
        try {
            const result = await transport_service_1.transportService.assignDriver(req.params.id, req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getStats(_req, res, next) {
        try {
            const stats = await transport_service_1.transportService.getStats();
            res.json(stats);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TransportController = TransportController;
exports.transportController = new TransportController();
//# sourceMappingURL=transport.controller.js.map