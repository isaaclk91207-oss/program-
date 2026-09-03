import { WialonUnit, WialonTrip } from "../types";
export declare class NetprosService {
    private baseUrl;
    constructor();
    login(username?: string, password?: string): Promise<string>;
    private fetchToken;
    searchItems(query?: string): Promise<WialonUnit[]>;
    getUnitTrips(unitId: number, timeFrom: number, timeTo: number): Promise<WialonTrip[]>;
    syncFleet(): Promise<{
        status: "success" | "error";
        unitsFound: number;
        tripsFound: number;
        timestamp: string;
        error?: string;
    }>;
    getSyncStatus(): {
        status: "error" | "idle" | "syncing";
        lastSyncTime: string | null;
        lastError: string | null;
        sessionActive: boolean;
    };
    private mapWialonError;
}
export declare const netprosService: NetprosService;
//# sourceMappingURL=netpros.service.d.ts.map