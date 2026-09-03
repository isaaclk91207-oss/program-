"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const cron_service_1 = require("./services/cron.service");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin, credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/v1", routes_1.default);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
app.listen(config_1.config.port, () => {
    console.log(`[PCCP] Server running on port ${config_1.config.port}`);
    console.log(`[PCCP] Health check: http://localhost:${config_1.config.port}/api/health`);
    console.log(`[PCCP] API base: http://localhost:${config_1.config.port}/api/v1`);
    cron_service_1.cronService.start();
});
exports.default = app;
//# sourceMappingURL=app.js.map