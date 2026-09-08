import { CreateDriverDto, UpdateDriverDto, DriverResponse } from "../types";
export declare class DriverService {
    getAll(filters?: {
        status?: string;
        search?: string;
        certStatus?: string;
    }): Promise<DriverResponse[]>;
    getById(id: string): Promise<DriverResponse>;
    create(data: CreateDriverDto): Promise<DriverResponse>;
    update(id: string, data: UpdateDriverDto): Promise<DriverResponse>;
    updateAssessment(driverId: string, data: {
        written: number;
        practical: Record<string, number>;
        operational: Record<string, number>;
    }): Promise<{
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
    }>;
    delete(id: string): Promise<void>;
    getAllAssessments(filters?: {
        driverId?: string;
        certLevel?: string;
    }): Promise<{
        id: string;
        driverId: string;
        driverName: string;
        driverEmail: string;
        written: number;
        practical: string;
        operational: string;
        feedbackAvg: number;
        overallScore: number;
        certLevel: string;
        createdAt: string;
    }[]>;
    getPassengers(filters?: {
        search?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        department: string;
        totalRequests: number;
        completedRequests: number;
    }[]>;
    getFeedback(driverId: string): Promise<({
        transportRequest: {
            id: string;
            pickup: string;
            destination: string;
        };
        passenger: {
            user: {
                name: string;
            };
        } & {
            userId: string;
            department: string;
        };
        vehicle: {
            plate: string;
        };
    } & {
        id: string;
        createdAt: Date;
        passengerId: string;
        driverId: string;
        vehicleId: string;
        requestId: string;
        rating: number;
        comment: string;
        tags: string;
    })[]>;
    getCertificationSummary(): Promise<{
        total: number;
        certified: number;
        pending: number;
        avgScore: number;
        byLevel: {
            level: string;
            count: number;
        }[];
        topPerformers: {
            id: string;
            name: string;
            score: number;
            level: string;
        }[];
    }>;
    private formatResponse;
}
export declare const driverService: DriverService;
//# sourceMappingURL=driver.service.d.ts.map