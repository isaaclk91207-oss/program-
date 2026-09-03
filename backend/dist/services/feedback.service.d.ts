import { CreateFeedbackDto } from "../types";
export declare class FeedbackService {
    submit(requestId: string, passengerId: string, data: CreateFeedbackDto): Promise<{
        id: string;
        requestId: string;
        passengerId: string;
        passengerName: string;
        driverId: string;
        driverName: string;
        vehicleId: string;
        vehiclePlate: string;
        rating: number;
        comment: string;
        tags: any;
        department: string;
        date: string;
    }>;
    getAll(filters?: {
        driverId?: string;
        rating?: number;
        search?: string;
    }): Promise<{
        id: string;
        requestId: string;
        passengerId: string;
        passengerName: string;
        driverId: string;
        driverName: string;
        vehicleId: string;
        vehiclePlate: string;
        rating: number;
        comment: string;
        tags: any;
        department: string;
        date: string;
    }[]>;
    getByDriver(driverId: string): Promise<({
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
    getDriverFeedbackStats(driverId: string): Promise<{
        average: number;
        count: number;
        distribution: Record<number, number>;
    }>;
}
export declare const feedbackService: FeedbackService;
//# sourceMappingURL=feedback.service.d.ts.map