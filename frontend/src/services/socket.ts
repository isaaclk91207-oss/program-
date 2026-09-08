import { io, Socket } from "socket.io-client";
import type { LiveVehicleLocation } from "../types";

const SOCKET_URL = "http://localhost:3001";

let socket: Socket | null = null;

export function getGpsSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectGpsSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onGpsUpdate(
  cb: (locations: LiveVehicleLocation[]) => void
): () => void {
  const s = getGpsSocket();
  s.on("gps:update", cb);
  return () => {
    s.off("gps:update", cb);
  };
}