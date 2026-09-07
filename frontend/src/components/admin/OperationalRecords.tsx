import { useState, useEffect } from "react";
import { Card, Badge, SearchInput, th } from "../ui";
import { getDriverTrips } from "../../services/api";
import type { TransportRequest, VehicleCheckin } from "../../types";
import { formatRequestId } from "../../types";
import { Calendar, MapPin, Clock, Car, User, Filter } from "lucide-react";

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
      const data = await getDriverTrips();
      setTrips(data);
    } catch (err) {
      console.error(err);
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
          <Calendar className="w-4 h-4 text-slate-400" />
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
              <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className={th.textSecondary}>No records found</p>
            </Card>
          ) : (
            filtered.map((t) => (
              <Card key={t.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium ${th.text}`}>{formatRequestId(t.id, t.requestNumber)}</p>
                      <Badge status={t.status}>{t.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className={th.textSecondary}>{t.passengerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400" />
                        <span className={`${th.textSecondary} font-mono`}>{t.vehiclePlate || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className={th.textSecondary}>{t.pickup} → {t.destination}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
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
