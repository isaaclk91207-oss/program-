import { DashboardStats } from "../types";
export declare class AdminService {
    getDashboard(): Promise<DashboardStats>;
    getSettings(): Promise<{
        id: string;
        updatedAt: Date;
        writtenWeight: number;
        practicalWeight: number;
        operationalWeight: number;
        feedbackWeight: number;
        passMarks: string;
    }>;
    updateSettings(data: {
        writtenWeight?: number;
        practicalWeight?: number;
        operationalWeight?: number;
        feedbackWeight?: number;
        passMarks?: Record<string, number>;
    }): Promise<{
        id: string;
        updatedAt: Date;
        writtenWeight: number;
        practicalWeight: number;
        operationalWeight: number;
        feedbackWeight: number;
        passMarks: string;
    }>;
    exportData(type: string, filters?: Record<string, unknown>): Promise<{
        name: string;
        id: string;
        email: string;
        certStatus: string;
        level: string;
        status: string;
        score: number;
        rating: number;
    }[] | {
        id: string;
        passengerName: string;
        department: string;
        pickup: string;
        destination: string;
        date: string;
        time: string;
        status: string;
        driverName: string;
        vehiclePlate: string;
    }[] | {
        driverName: string;
        driverId: string;
        passengerName: string;
        vehiclePlate: string;
        requestId: string;
        rating: number;
        comment: string;
        tags: any;
        date: string;
    }[] | {
        id: string;
        driverName: string;
        driverId: string;
        vehiclePlate: string;
        requestId: string;
        checkInLocation: string | null;
        checkInTime: string;
        checkOutLocation: string | null;
        checkOutTime: string;
        status: string;
    }[] | {
        name: string;
        id: string;
        written: number;
        overallScore: number;
        level: string;
        certStatus: string;
    }[]>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=admin.service.d.ts.map