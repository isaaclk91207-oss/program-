import { LoginRequest, LoginResponse } from "../types";
export declare class AuthService {
    login(data: LoginRequest): Promise<LoginResponse>;
    register(data: {
        email: string;
        password: string;
        name: string;
        role: "ADMIN" | "DRIVER" | "PASSENGER";
        phone?: string;
    }): Promise<LoginResponse>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        phone: string | null;
        driverProfile: ({
            currentVehicle: {
                year: number;
                id: string;
                status: string;
                plate: string;
                qrValue: string;
                make: string;
                model: string;
                color: string;
                gpsDeviceId: number | null;
            } | null;
            assessments: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certLevel: string;
                driverId: string;
                written: number;
                practical: string;
                operational: string;
                feedbackAvg: number;
                overallScore: number;
            }[];
        } & {
            userId: string;
            certLevel: string;
            certStatus: string;
            validUntil: Date | null;
            licenseNo: string | null;
            joinedDate: Date;
            accidentFree: string | null;
            englishLevel: string | null;
            credits: number;
            currentVehicleId: string | null;
            status: string;
        }) | null;
        passengerProfile: {
            userId: string;
            department: string;
        } | null;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map