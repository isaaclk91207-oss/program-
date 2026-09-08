import { CreateTransportRequestDto, AssignDriverDto, TransportRequestResponse } from "../types";
export declare class TransportService {
    getAll(filters?: {
        status?: string;
        search?: string;
        role?: string;
        userId?: string;
    }, page?: number, limit?: number): Promise<{
        requests: TransportRequestResponse[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getById(id: string): Promise<{
        driver: ({
            user: {
                id: string;
                email: string;
                name: string;
                phone: string | null;
            };
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
        passenger: {
            user: {
                id: string;
                email: string;
                name: string;
                phone: string | null;
            };
        } & {
            userId: string;
            department: string;
        };
        vehicle: {
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
        feedback: {
            id: string;
            createdAt: Date;
            passengerId: string;
            driverId: string;
            vehicleId: string;
            requestId: string;
            rating: number;
            comment: string;
            tags: string;
        } | null;
        notifications: {
            id: string;
            createdAt: Date;
            recipientId: string;
            recipientRole: string;
            title: string;
            message: string;
            read: boolean;
            relatedRequestId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        passengerId: string;
        driverId: string | null;
        vehicleId: string | null;
        pickup: string;
        destination: string;
        date: Date;
        time: string;
    }>;
    create(data: CreateTransportRequestDto): Promise<TransportRequestResponse>;
    assignDriver(requestId: string, data: AssignDriverDto): Promise<TransportRequestResponse>;
    transitionStatus(requestId: string, newStatus: string): Promise<{
        driver: ({
            user: {
                name: string;
            };
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
        passenger: {
            user: {
                name: string;
            };
        } & {
            userId: string;
            department: string;
        };
        vehicle: {
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        passengerId: string;
        driverId: string | null;
        vehicleId: string | null;
        pickup: string;
        destination: string;
        date: Date;
        time: string;
    }>;
    getStats(): Promise<{
        total: number;
        byStatus: {
            status: string;
            count: number;
        }[];
        byDepartment: {
            department: string;
            count: number;
        }[];
    }>;
    private formatResponse;
}
export declare const transportService: TransportService;
//# sourceMappingURL=transport.service.d.ts.map