"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_CATEGORIES = exports.OPERATIONAL_CRITERIA = exports.PRACTICAL_CRITERIA = exports.DEFAULT_WEIGHTS = exports.PASS_MARKS = exports.CERT_LEVELS = exports.DEPARTMENTS = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || "3001", 10),
    databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
    jwtSecret: process.env.JWT_SECRET || "pccp-dev-secret-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    bcryptSaltRounds: 10,
    wialonBaseUrl: process.env.WIALON_BASE_URL || "https://wh101.wialon.com",
    wialonToken: process.env.WIALON_TOKEN || "",
    cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4173",
};
exports.DEPARTMENTS = [
    "Executive",
    "Finance",
    "HR",
    "Operations",
    "Marketing",
    "IT",
    "Legal",
];
exports.CERT_LEVELS = ["CD", "CC", "CPC", "CEC", "CMC"];
exports.PASS_MARKS = {
    CD: 75,
    CC: 80,
    CPC: 85,
    CEC: 88,
    CMC: 90,
};
exports.DEFAULT_WEIGHTS = {
    written: 0.2,
    practical: 0.3,
    operational: 0.3,
    feedback: 0.2,
};
exports.PRACTICAL_CRITERIA = [
    { key: "preTripReadiness", label: "Pre Trip Readiness", weight: 0.2 },
    { key: "vehicleInspection", label: "Vehicle Inspection", weight: 0.2 },
    { key: "safety", label: "Safety", weight: 0.3 },
    { key: "behavior", label: "Behavior", weight: 0.15 },
    { key: "serviceDelivery", label: "Service Delivery", weight: 0.15 },
];
exports.OPERATIONAL_CRITERIA = [
    { key: "accidentRecord", label: "Accident Record", weight: 0.2 },
    { key: "vehicleDamage", label: "Vehicle Damage", weight: 0.2 },
    { key: "attendance", label: "Attendance", weight: 0.2 },
    { key: "documentation", label: "Documentation", weight: 0.1 },
    { key: "vehicleUtilization", label: "Vehicle Utilization / Driving Hours", weight: 0.3 },
];
exports.TAG_CATEGORIES = {
    negative: [
        { id: "safety", label: "Safety Concerns" },
        { id: "behavior", label: "Driver Behavior" },
        { id: "cleanliness", label: "Vehicle Cleanliness" },
        { id: "service", label: "Service" },
        { id: "punctuality", label: "Punctuality" },
        { id: "other", label: "Other Issues" },
    ],
    positive: [
        { id: "service", label: "Excellent Service" },
        { id: "safety", label: "Felt Safe" },
        { id: "cleanliness", label: "Clean Vehicle" },
        { id: "behavior", label: "Professional Driver" },
        { id: "punctuality", label: "Punctual" },
    ],
};
//# sourceMappingURL=index.js.map