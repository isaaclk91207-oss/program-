import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Error handler
app.use((err: Error & { statusCode?: number; code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred";

  console.error(`[ERROR] ${code}: ${message}`);
  if (statusCode === 500) console.error(err.stack);

  res.status(statusCode).json({ error: { code, message } });
});

export default app;
