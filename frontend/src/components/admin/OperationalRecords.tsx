import { useState, useEffect } from "react";
import { Card, Badge, SearchInput, th, Icon } from "../ui";
import { getRequests, getAllRequestsV2 } from "../../services/api";
import type { TransportRequest, TransportStatus } from "../../types";
import { formatRequestId } from "../../types";

const V1_RECORD_STATUSES: TransportStatus[] = ["FEEDBACK_SUBMITTED", "DROP_OFF_SCANNED", "COMPLETED"];

function isRecord(t: TransportRequest): boolean {
  const st = t.status as string;
  if (t.version === "v2") {
    return st === "DROPOFF_COMPLETE" || st === "COMPLETED";
  }
  return V1_RECORD_STATUSES.includes(t.status);
}

export default function OperationalRecords() {
  const [trips, setTrips] = useState<TransportRequest[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    setLoading(true);
    try {
      const [v1Data, v2Raw] = await Promise.all([
        getRequests(),
        getAllRequestsV2().catch(() => []),
      ]);

      const v1Reqs: TransportRequest[] = (v1Data.requests || []).map((r) => ({
        ...r,
        version: "v1" as const,
      }));

      const v2Reqs: TransportRequest[] = (Array.isArray(v2Raw) ? v2Raw : []).map((r: Record<string, unknown>) => {
        const dateStr = r.requestDate ? new Date(r.requestDate as string) : new Date();
        const trip = r.trip as Record<string, unknown> | undefined;
        const tripDriver = trip?.driver as Record<string, unknown> | undefined;
        const tripVehicle = trip?.vehicle as Record<string, unknown> | undefined;
        return {
          id: r.id as string,
          requestNumber: r.requestNumber as string | undefined,
          passengerId: "",
          passengerName: (r.passengerName as string) || "",
          department: (r.department as string) || "",
          driverId: (tripDriver?.id as string) || null,
          driverName: (tripDriver?.name as string) || null,
          vehicleId: (tripVehicle?.id as string) || null,
          vehiclePlate: (tripVehicle?.plateNumber as string) || null,
          status: (r.status as TransportStatus) || "PENDING",
          pickup: (r.pickupLocation as string) || "",
          destination: (r.destination as string) || "",
          date: dateStr.toLocaleDateString(),
          time: dateStr.toLocaleTimeString(),
          qrScanStatus: null,
          feedbackStatus: null,
          createdAt: (r.createdAt as string) || new Date().toISOString(),
          version: "v2" as const,
        } as TransportRequest;
      });

      const all = [...v1Reqs, ...v2Reqs].filter((t) => isRecord(t));
      setTrips(all);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = trips
    .filter((t) => {
      if (search === "") return true;
      return (
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.requestNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        t.passengerName.toLowerCase().includes(search.toLowerCase()) ||
        (t.driverName || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.vehiclePlate && t.vehiclePlate.toLowerCase().includes(search.toLowerCase()))
      );
    })
    .filter((t) => {
      if (!dateFrom && !dateTo) return true;
      const tripDate = new Date(t.date);
      if (dateFrom && tripDate < new Date(dateFrom)) return false;
      if (dateTo && tripDate > new Date(dateTo)) return false;
      return true;
    });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Operational Records</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search records..." className="w-full sm:w-64" />
        <div className="flex items-center gap-2">
          <Icon name="calendar_today" size={16} className="text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text}`}
          />
          <span className={th.textMuted}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text}`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <Icon name="filter_list" size={32} className="text-slate-400 mx-auto mb-2" />
              <p className={th.textSecondary}>No records found</p>
            </Card>
          ) : (
            filtered.map((t) => (
              <Card key={`${t.version}-${t.id}`} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium ${th.text}`}>{formatRequestId(t.id, t.requestNumber)}</p>
                      <Badge status={t.status}>{t.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Icon name="person" size={12} className="text-slate-400" />
                        <span className={th.textSecondary}>{t.passengerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="person" size={12} className="text-slate-400" />
                        <span className={`${th.textSecondary} font-mono`}>{t.driverName || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="directions_car" size={12} className="text-slate-400" />
                        <span className={`${th.textSecondary} font-mono`}>{t.vehiclePlate || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="location_on" size={12} className="text-slate-400" />
                        <span className={th.textSecondary}>{t.pickup} → {t.destination}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="calendar_today" size={12} className="text-slate-400" />
                        <span className={th.textSecondary}>{t.date} {t.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
