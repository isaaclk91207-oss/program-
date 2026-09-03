import { QRScanPayload, QRVerificationResult, CheckInDto, CheckOutDto } from "../types";
export declare class TripService {
    verifyQR(payload: QRScanPayload, userId: string, role: string): Promise<QRVerificationResult>;
    pickupQRScan(requestId: string, userId: string): Promise<{
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
    dropoffQRScan(requestId: string, userId: string): Promise<{
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
    driverCheckIn(driverId: string, data: CheckInDto): Promise<{
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
    }>;
    driverCheckOut(driverId: string, data: CheckOutDto): Promise<{
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
    }>;
    getDriverTrips(driverId: string, status?: string): Promise<({
        passenger: {
            user: {
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
        } | null;
        feedback: {
            id: string;
            rating: number;
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
    })[]>;
    getPassengerTrips(passengerId: string, status?: string): Promise<({
        driver: ({
            user: {
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
        vehicle: {
            year: number;
            id: string;
            status: string;
            plate: string;
            qrValue: string;
            make: string;
            model: string;
            color: string;
        } | null;
        feedback: {
            id: string;
            rating: number;
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
    })[]>;
    getTripDetail(requestId: string): Promise<{
        vehicleCheckins: {
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
        }[];
        driver: ({
            user: {
                id: string;
                email: string;
                name: string;
                phone: string | null;
            };
            currentVehicle: {
                year: number;
                id: string;
                status: string;
                plate: string;
                qrValue: string;
                make: string;
                model: string;
                color: string;
            } | null;
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
}
export declare const tripService: TripService;
//# sourceMappingURL=trip.service.d.ts.map