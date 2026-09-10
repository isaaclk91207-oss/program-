import { prisma } from "../lib/prisma";

const MOVING_THRESHOLD_KMH = 5;
const GAP_THRESHOLD_MINUTES = 5;
const CAPPED_GAP_MS = GAP_THRESHOLD_MINUTES * 60 * 1000;

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
          if (gapMs <= 0) continue;

          if (gapMs > CAPPED_GAP_MS) {
            tripCount++;
          }
          totalMs += Math.min(gapMs, CAPPED_GAP_MS);
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

    const checkins = await prisma.vehicleCheckin.findMany({
      select: {
        driverId: true,
        vehicleId: true,
        checkInTime: true,
        checkOutTime: true,
        driver: { select: { user: { select: { name: true } } } },
      },
    });

    const driverVehicleMap: Record<string, { name: string; vehicles: Map<string, { checkIn: Date; checkOut: Date | null }> }> = {};
    for (const c of checkins) {
      if (!c.driverId || !c.vehicleId || !c.checkInTime) continue;
      if (!driverVehicleMap[c.driverId]) {
        driverVehicleMap[c.driverId] = { name: c.driver.user.name, vehicles: new Map() };
      }
      const existing = driverVehicleMap[c.driverId].vehicles.get(c.vehicleId);
      if (!existing || c.checkInTime > existing.checkIn) {
        driverVehicleMap[c.driverId].vehicles.set(c.vehicleId, {
          checkIn: c.checkInTime,
          checkOut: c.checkOutTime,
        });
      }
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

      for (const [vehicleId] of data.vehicles) {
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
