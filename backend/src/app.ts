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

server.listen(config.port, () => {
  console.log(`[PCCP] Server running on port ${config.port}`);
  console.log(`[PCCP] Health check: http://localhost:${config.port}/api/health`);
  console.log(`[PCCP] API base: http://localhost:${config.port}/api/v1`);
  console.log(`[PCCP] Socket.io: ws://localhost:${config.port}`);
  cronService.start();
  gpsService.start(io);
  socketService.start(io);
});

export default app;
