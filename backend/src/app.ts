import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { cronService } from "./services/cron.service";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[PCCP] Server running on port ${config.port}`);
  console.log(`[PCCP] Health check: http://localhost:${config.port}/api/health`);
  console.log(`[PCCP] API base: http://localhost:${config.port}/api/v1`);
  cronService.start();
});

export default app;
