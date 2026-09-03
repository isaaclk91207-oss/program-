"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getMe(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
            }
            const user = await auth_service_1.authService.getMe(req.user.id);
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map