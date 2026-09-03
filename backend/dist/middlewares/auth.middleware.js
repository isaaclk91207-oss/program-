"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const error_middleware_1 = require("./error.middleware");
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next((0, error_middleware_1.createAppError)(401, "UNAUTHORIZED", "Missing or invalid authorization header"));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next((0, error_middleware_1.createAppError)(401, "TOKEN_EXPIRED", "Token has expired"));
        }
        return next((0, error_middleware_1.createAppError)(401, "INVALID_TOKEN", "Invalid token"));
    }
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret, {
        expiresIn: config_1.config.jwtExpiresIn,
    });
}
//# sourceMappingURL=auth.middleware.js.map