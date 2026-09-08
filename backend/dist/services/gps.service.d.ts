import { Server as SocketIOServer } from "socket.io";
export declare class GpsService {
    private io;
    private timer;
    private latestLocations;
    private lastPollTime;
    private lastError;
    start(io: SocketIOServer): void;
    stop(): void;
    getStatus(): {
        running: boolean;
        pollIntervalMs: number;
        lastPollTime: string | null;
        lastError: string | null;
        vehiclesTracked: number;
    };
    poll(): Promise<void>;
}
export declare const gpsService: GpsService;
//# sourceMappingURL=gps.service.d.ts.map