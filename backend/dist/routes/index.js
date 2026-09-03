"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const transport_routes_1 = __importDefault(require("./transport.routes"));
const trip_routes_1 = __importDefault(require("./trip.routes"));
const driver_routes_1 = __importDefault(require("./driver.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const feedback_routes_1 = __importDefault(require("./feedback.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/requests", transport_routes_1.default);
router.use("/trips", trip_routes_1.default);
router.use("/drivers", driver_routes_1.default);
router.use("/vehicles", vehicle_routes_1.default);
router.use("/feedback", feedback_routes_1.default);
router.use("/notifications", notification_routes_1.default);
router.use("/admin", admin_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map