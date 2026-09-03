export declare class CronService {
    start(): void;
    stop(): void;
    getStatus(): {
        running: boolean;
        schedule: string;
    };
    triggerNow(): Promise<{
        status: "success" | "error";
        unitsFound: number;
        tripsFound: number;
        timestamp: string;
        error?: string;
    }>;
}
export declare const cronService: CronService;
//# sourceMappingURL=cron.service.d.ts.map