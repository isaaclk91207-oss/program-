import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { cronService } from "./services/cron.service";
import { gpsService } from "./services/gps.service";
import { socketService } from "./services/socket.service";
import { PrismaClient } from "@prisma/client";
const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function ensureEcoDrivingTable() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "eco_driving_records" (
        "id" TEXT NOT NULL,
        "driverId" TEXT NOT NULL,
        "vehicleId" TEXT NOT NULL,
        "violationType" TEXT NOT NULL,
        "violationValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "penaltyPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "rank" DOUBLE PRECISION NOT NULL DEFAULT 10,
        "duration" DOUBLE PRECISION,
        "mileage" DOUBLE PRECISION,
        "avgSpeed" DOUBLE PRECISION,
        "tripDuration" DOUBLE PRECISION,
        "engineHoursDuration" DOUBLE PRECISION,
        "date" TIMESTAMP(3) NOT NULL,
        "syncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "netprosUnitId" TEXT,
        CONSTRAINT "eco_driving_records_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "eco_driving_records_vehicleId_violationType_date_key"
        ON "eco_driving_records"("vehicleId", "violationType", "date")
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "eco_driving_records"
          ADD CONSTRAINT "eco_driving_records_driverId_fkey"
          FOREIGN KEY ("driverId") REFERENCES "driver_profiles"("userId")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "eco_driving_records"
          ADD CONSTRAINT "eco_driving_records_vehicleId_fkey"
          FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    console.log("[PCCP] eco_driving_records table ensured");
  } catch (err) {
    console.error("[PCCP] Failed to ensure eco_driving_records table:", err);
  } finally {
    await prisma.$disconnect();
  }
}

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    // noop
  });
});

server.listen(config.port, async () => {
  console.log(`[PCCP] Server running on port ${config.port}`);
  console.log(`[PCCP] Health check: http://localhost:${config.port}/api/health`);
  console.log(`[PCCP] API base: http://localhost:${config.port}/api/v1`);
  console.log(`[PCCP] Socket.io: ws://localhost:${config.port}`);
  await ensureEcoDrivingTable();
  cronService.start();
  gpsService.start(io);
  socketService.start(io);
});

export default app;
