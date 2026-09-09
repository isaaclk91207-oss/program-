import { prisma } from "../lib/prisma";

const MOVING_THRESHOLD_KMH = 5;
const GAP_THRESHOLD_MINUTES = 5;

interface GpsHoursResult {
  vehicleId: string;
  plate: string;
  gpsHours: number;
  tripCount: number;
}

interface DriverGpsHoursResult {
  driverId: string;
  driverName: string;
  gpsHours: number;
  tripCount: number;
  vehicles: { plate: string; gpsHours: number; tripCount: number }[];
}

export class GpsHoursService {
  async getGpsHoursByVehicle(
    dateFrom?: string,
    dateTo?: string
  ): Promise<GpsHoursResult[]> {
    const where: Record<string, unknown> = {
      speed: { gt: MOVING_THRESHOLD_KMH },
    };

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) (where.timestamp as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.timestamp as Record<string, unknown>).lte = new Date(dateTo);
    }

    const positions = await prisma.gpsPosition.findMany({
      where,
      orderBy: [{ vehicleId: "asc" }, { timestamp: "asc" }],
      select: {
        vehicleId: true,
        plate: true,
        speed: true,
        timestamp: true,
      },
    });

    const vehicleMap: Record<string, { plate: string; positions: Date[] }> = {};
    for (const pos of positions) {
      if (!vehicleMap[pos.vehicleId]) {
        vehicleMap[pos.vehicleId] = { plate: pos.plate, positions: [] };
      }
      vehicleMap[pos.vehicleId].positions.push(pos.timestamp);
    }

    const results: GpsHoursResult[] = [];
    for (const [vehicleId, data] of Object.entries(vehicleMap)) {
      const { plate, positions: timestamps } = data;
      let totalMs = 0;
      let tripCount = 0;
      let lastTime: Date | null = null;

      for (const ts of timestamps) {
        if (lastTime) {
          const gapMs = ts.getTime() - lastTime.getTime();
          const gapMinutes = gapMs / 60000;

          if (gapMinutes > GAP_THRESHOLD_MINUTES) {
            tripCount++;
          }
          totalMs += gapMs;
        }
        lastTime = ts;
      }

      if (totalMs > 0) tripCount++;

      results.push({
        vehicleId,
        plate,
        gpsHours: Math.round((totalMs / 3600000) * 10) / 10,
        tripCount,
      });
    }

    return results;
  }

  async getGpsHoursByDriver(
    dateFrom?: string,
    dateTo?: string
  ): Promise<DriverGpsHoursResult[]> {
    const vehicleHours = await this.getGpsHoursByVehicle(dateFrom, dateTo);

    const vehicleDriverMap = await prisma.transportRequest.findMany({
      where: { driverId: { not: null } },
      select: {
        driverId: true,
        vehicleId: true,
        driver: { select: { user: { select: { name: true } } } },
      },
    });

    const driverVehicleMap: Record<string, { name: string; vehicles: Set<string> }> = {};
    for (const tr of vehicleDriverMap) {
      if (!tr.driverId || !tr.vehicleId || !tr.driver) continue;
      if (!driverVehicleMap[tr.driverId]) {
        driverVehicleMap[tr.driverId] = { name: tr.driver.user.name, vehicles: new Set() };
      }
      driverVehicleMap[tr.driverId].vehicles.add(tr.vehicleId);
    }

    const vehicleHoursMap: Record<string, GpsHoursResult> = {};
    for (const vh of vehicleHours) {
      vehicleHoursMap[vh.vehicleId] = vh;
    }

    const results: DriverGpsHoursResult[] = [];
    for (const [driverId, data] of Object.entries(driverVehicleMap)) {
      let totalHours = 0;
      let totalTrips = 0;
      const vehicles: { plate: string; gpsHours: number; tripCount: number }[] = [];

      for (const vehicleId of data.vehicles) {
        const vh = vehicleHoursMap[vehicleId];
        if (vh) {
          totalHours += vh.gpsHours;
          totalTrips += vh.tripCount;
          vehicles.push({ plate: vh.plate, gpsHours: vh.gpsHours, tripCount: vh.tripCount });
        }
      }

      results.push({
        driverId,
        driverName: data.name,
        gpsHours: Math.round(totalHours * 10) / 10,
        tripCount: totalTrips,
        vehicles,
      });
    }

    return results;
  }

  async getDriverGpsHours(
    driverId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ gpsHours: number; tripCount: number; vehicles: { plate: string; gpsHours: number; tripCount: number }[] }> {
    const allDriverHours = await this.getGpsHoursByDriver(dateFrom, dateTo);
    const driverHours = allDriverHours.find((d) => d.driverId === driverId);

    if (!driverHours) {
      return { gpsHours: 0, tripCount: 0, vehicles: [] };
    }

    return {
      gpsHours: driverHours.gpsHours,
      tripCount: driverHours.tripCount,
      vehicles: driverHours.vehicles,
    };
  }
}

export const gpsHoursService = new GpsHoursService();
