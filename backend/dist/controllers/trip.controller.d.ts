import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
export declare class TripController {
    verifyQR(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    pickupQRScan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    dropoffQRScan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    driverCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    driverCheckOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getDriverTrips(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getPassengerTrips(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getTripDetail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const tripController: TripController;
//# sourceMappingURL=trip.controller.d.ts.map