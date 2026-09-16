import { io, Socket } from "socket.io-client";
import type { LiveVehicleLocation, Notification, TransportRequest } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "https://pccp-backend.onrender.com";

let socket: Socket | null = null;

export function getGpsSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      upgrade: true,
      rememberUpgrade: true,
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

export interface TripStatusEvent {
  requestId: string;
  status: string;
  driverId?: string | null;
  pickedUpAt?: string;
  droppedOffAt?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export function onTripStatusChanged(
  cb: (event: TripStatusEvent) => void
): () => void {
  const s = getGpsSocket();
  s.on("trip:statusChanged", cb);
  return () => {
    s.off("trip:statusChanged", cb);
  };
}

export function onNotificationNew(
  cb: (notification: Notification) => void
): () => void {
  const s = getGpsSocket();
  s.on("notification:new", cb);
  return () => {
    s.off("notification:new", cb);
  };
}

export function onRequestNew(
  cb: (request: TransportRequest) => void
): () => void {
  const s = getGpsSocket();
  s.on("request:new", cb);
  return () => {
    s.off("request:new", cb);
  };
}
