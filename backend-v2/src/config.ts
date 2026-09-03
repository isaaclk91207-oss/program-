import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  databaseUrl: process.env.DATABASE_URL || "postgresql://pccp:pccp_dev@localhost:5432/pccp",
  wialonBaseUrl: process.env.WIALON_BASE_URL || "https://s7.netprogps.net",
  wialonToken: process.env.WIALON_TOKEN || "",
  wialonEcoReportResourceId: parseInt(process.env.WIALON_ECO_REPORT_RESOURCE_ID || "0", 10),
  wialonEcoReportTemplateId: parseInt(process.env.WIALON_ECO_REPORT_TEMPLATE_ID || "0", 10),
  wialonDriverReportResourceId: parseInt(process.env.WIALON_DRIVER_REPORT_RESOURCE_ID || "0", 10),
  cronSchedule: process.env.CRON_SCHEDULE || "0 */6 * * *",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
