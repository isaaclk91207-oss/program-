"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createAppError = createAppError;
exports.notFoundHandler = notFoundHandler;
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || "INTERNAL_ERROR";
    const message = err.message || "An unexpected error occurred";
    console.error(`[ERROR] ${code}: ${message}`);
    if (statusCode === 500) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        error: {
            code,
            message,
        },
    });
}
function createAppError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
function notFoundHandler(req, _res, next) {
    const error = createAppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
    next(error);
}
//# sourceMappingURL=error.middleware.js.map