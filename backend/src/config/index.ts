import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  jwtSecret: process.env.JWT_SECRET || "pccp-dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  bcryptSaltRounds: 10,
  wialonBaseUrl: process.env.WIALON_BASE_URL || "https://wh101.wialon.com",
  wialonToken: process.env.WIALON_TOKEN || "",
  cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

export const DEPARTMENTS = [
  "Executive",
  "Finance",
  "HR",
  "Operations",
  "Marketing",
  "IT",
  "Legal",
] as const;

export const CERT_LEVELS: readonly string[] = ["CD", "CC", "CPC", "CEC", "CMC"] as const;

export const PASS_MARKS: Record<string, number> = {
  CD: 75,
  CC: 80,
  CPC: 85,
  CEC: 88,
  CMC: 90,
};

export const DEFAULT_WEIGHTS = {
  written: 0.2,
  practical: 0.3,
  operational: 0.3,
  feedback: 0.2,
};

export const PRACTICAL_CRITERIA = [
  { key: "preTripReadiness", label: "Pre Trip Readiness", weight: 0.2 },
  { key: "vehicleInspection", label: "Vehicle Inspection", weight: 0.2 },
  { key: "safety", label: "Safety", weight: 0.3 },
  { key: "behavior", label: "Behavior", weight: 0.15 },
  { key: "serviceDelivery", label: "Service Delivery", weight: 0.15 },
];

export const OPERATIONAL_CRITERIA = [
  { key: "accidentRecord", label: "Accident Record", weight: 0.2 },
  { key: "vehicleDamage", label: "Vehicle Damage", weight: 0.2 },
  { key: "attendance", label: "Attendance", weight: 0.2 },
  { key: "documentation", label: "Documentation", weight: 0.1 },
  { key: "vehicleUtilization", label: "Vehicle Utilization / Driving Hours", weight: 0.3 },
];

export const TAG_CATEGORIES = {
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
