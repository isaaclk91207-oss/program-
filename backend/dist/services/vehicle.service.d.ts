import { CreateVehicleDto, UpdateVehicleDto, VehicleResponse } from "../types";
export declare class VehicleService {
    getAll(filters?: {
        status?: string;
        search?: string;
    }): Promise<VehicleResponse[]>;
    getById(id: string): Promise<{
        vehicleCheckins: ({
            transportRequest: {
                id: string;
            };
            driver: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            driverId: string;
            vehicleId: string;
            requestId: string;
            checkInLocation: string | null;
            checkInTime: Date | null;
            checkInRemark: string | null;
            checkOutLocation: string | null;
            checkOutTime: Date | null;
            checkOutRemark: string | null;
        })[];
        transportRequests: ({
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
        })[];
        driverProfiles: ({
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
        })[];
    } & {
        year: number;
        id: string;
        status: string;
        plate: string;
        qrValue: string;
        make: string;
        model: string;
        color: string;
        gpsDeviceId: number | null;
    }>;
    getByPlate(plate: string): Promise<{
        driverProfiles: ({
            user: {
                id: string;
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
        })[];
    } & {
        year: number;
        id: string;
        status: string;
        plate: string;
        qrValue: string;
        make: string;
        model: string;
        color: string;
        gpsDeviceId: number | null;
    }>;
    create(data: CreateVehicleDto): Promise<VehicleResponse>;
    update(id: string, data: UpdateVehicleDto): Promise<VehicleResponse>;
    findByQrValue(qrValue: string): Promise<({
        driverProfiles: {
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
        }[];
    } & {
        year: number;
        id: string;
        status: string;
        plate: string;
        qrValue: string;
        make: string;
        model: string;
        color: string;
        gpsDeviceId: number | null;
    }) | null>;
    delete(id: string): Promise<void>;
    private formatResponse;
}
export declare const vehicleService: VehicleService;
//# sourceMappingURL=vehicle.service.d.ts.map