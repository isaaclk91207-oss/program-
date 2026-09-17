import { useState, useEffect } from "react";
import { Card, KPICard, LoadingSpinner, th, Icon, Button } from "../ui";
import { getAdminEcoDriving, getDrivers, triggerEcoSync } from "../../services/api";

interface EcoDrivingRecord {
  id: string;
  violationType: string;
  penaltyPoints: number;
  rank: number;
  date: string;
  driver: { id: string; name: string; employeeId: string };
  vehicle: { id: string; plateNumber: string };
}

interface EcoDrivingSummary {
  totalRecords: number;
  totalPenalties: number;
  avgRank: number;
  topOffenders: { name: string; employeeId: string; totalPenalties: number; violationCount: number }[];
}

interface DriverOption {
  id: string;
  name: string;
  employeeId: string;
}

function getViolationIcon(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("speed") || lower.includes("overspeed")) return "speed";
  if (lower.includes("brake") || lower.includes("harsh")) return "brake_alert";
  if (lower.includes("accel") || lower.includes("quick")) return "trending_up";
  if (lower.includes("idle")) return "timer";
  if (lower.includes("turn") || lower.includes("corner")) return "turn_slight_right";
  if (lower.includes("seat") || lower.includes("belt")) return "airline_seat_individual_suite";
  if (lower.includes("fuel") || lower.includes("consumption")) return "local_gas_station";
  return "warning";
}

function getViolationColor(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("speed") || lower.includes("overspeed")) return "text-red-500 bg-red-50 dark:bg-red-500/20";
  if (lower.includes("brake") || lower.includes("harsh")) return "text-orange-500 bg-orange-50 dark:bg-orange-500/20";
  if (lower.includes("accel") || lower.includes("quick")) return "text-amber-500 bg-amber-50 dark:bg-amber-500/20";
  if (lower.includes("idle")) return "text-blue-500 bg-blue-50 dark:bg-blue-500/20";
  return "text-slate-500 bg-slate-50 dark:bg-slate-500/20";
}

function getRankBadge(rank: number): { color: string; label: string } {
  if (rank <= 3) return { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Excellent" };
  if (rank <= 5) return { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Good" };
  if (rank <= 7) return { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Fair" };
  return { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Poor" };
}

export default function EcoDrivingPage() {
  const [records, setRecords] = useState<EcoDrivingRecord[]>([]);
  const [summary, setSummary] = useState<EcoDrivingSummary | null>(null);
  const [violationTypes, setViolationTypes] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filterDriver, setFilterDriver] = useState("");
  const [filterViolation, setFilterViolation] = useState("");
  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [filterTo, setFilterTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    getDrivers().then((d) => setDrivers(d.map((drv) => ({ id: drv.id, name: drv.name, employeeId: drv.employeeId || "" })))).catch(() => {});
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterDriver) params.driverId = filterDriver;
      if (filterViolation) params.violationType = filterViolation;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const result = await getAdminEcoDriving(params);
      setRecords(result.records || []);
      setSummary(result.summary || null);
      setViolationTypes(result.violationTypes || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(apiErr.response?.data?.error?.message || "Failed to fetch eco driving data");
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    fetchData();
  }

  function handleReset() {
    setFilterDriver("");
    setFilterViolation("");
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setFilterFrom(d.toISOString().slice(0, 10));
    setFilterTo(new Date().toISOString().slice(0, 10));
    setTimeout(fetchData, 100);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const result = await triggerEcoSync();
      const gpsMsg = result.gpsSync
        ? `GPS: ${result.gpsSync.linked} vehicles linked, ${result.gpsSync.unitsFound} units found.`
        : "";
      setSyncResult(
        result.status === "success"
          ? `Sync complete: ${result.vehiclesProcessed} vehicles, ${result.totalViolations} violations. ${gpsMsg}`
          : `Sync failed: ${result.error || "Unknown error"}`
      );
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(apiErr.response?.data?.error?.message || "Failed to sync eco-driving data");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icon name="eco" size={24} className="text-role-admin" />
          Eco-Driving Violations
        </h2>
        <Button
          accent="admin"
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <Icon name={syncing ? "hourglass_empty" : "sync"} size={16} />
          {syncing ? "Syncing..." : "Sync from NetPros"}
        </Button>
      </div>

      {syncResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          syncResult.includes("failed") || syncResult.includes("error")
            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
        }`}>
          <Icon name={syncResult.includes("failed") || syncResult.includes("error") ? "error_outline" : "check_circle"} size={18} />
          {syncResult}
        </div>
      )}

      {/* Filters */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className={`block text-xs font-medium ${th.textSecondary} mb-1`}>Driver</label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${th.border} ${th.bgInput} ${th.text}`}
            >
              <option value="">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.employeeId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium ${th.textSecondary} mb-1`}>Violation Type</label>
            <select
              value={filterViolation}
              onChange={(e) => setFilterViolation(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${th.border} ${th.bgInput} ${th.text}`}
            >
              <option value="">All Types</option>
              {violationTypes.map((vt) => (
                <option key={vt} value={vt}>{vt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium ${th.textSecondary} mb-1`}>From Date</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${th.border} ${th.bgInput} ${th.text}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${th.textSecondary} mb-1`}>To Date</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${th.border} ${th.bgInput} ${th.text}`}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button accent="admin" onClick={handleFilter} className="flex-1">
              <Icon name="search" size={16} className="mr-1" /> Filter
            </Button>
            <Button variant="secondary" onClick={handleReset} className="flex-1">
              <Icon name="restart_alt" size={16} className="mr-1" /> Reset
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card className="p-6 text-center">
          <Icon name="error_outline" size={40} className="text-red-400 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
          <Button variant="secondary" onClick={fetchData} className="mt-3">Retry</Button>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Violations"
                value={summary.totalRecords}
                icon={<Icon name="warning" size={20} />}
                color="orange"
              />
              <KPICard
                label="Total Penalties"
                value={summary.totalPenalties}
                icon={<Icon name="gavel" size={20} />}
                color="red"
              />
              <KPICard
                label="Avg Rank"
                value={summary.avgRank}
                icon={<Icon name="speed" size={20} />}
                color="blue"
              />
              <KPICard
                label="Violation Types"
                value={violationTypes.length}
                icon={<Icon name="category" size={20} />}
                color="purple"
              />
            </div>
          )}

          {/* Top Offenders */}
          {summary && summary.topOffenders.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon name="flag" size={18} className="text-red-500" />
                Top Offenders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {summary.topOffenders.map((offender, idx) => (
                  <div
                    key={offender.employeeId}
                    className={`p-3 rounded-xl border ${th.border} ${th.bgCard}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-400 text-white" :
                        idx === 1 ? "bg-gray-300 text-gray-700" :
                        idx === 2 ? "bg-orange-300 text-orange-700" :
                        "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${th.text} truncate`}>{offender.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{offender.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-500 font-bold">{offender.totalPenalties} penalties</span>
                      <span className={th.textSecondary}>{offender.violationCount} violations</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Violation Records Table */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Icon name="list" size={18} className="text-role-admin" />
              Violation Records
              <span className={`text-xs font-normal ${th.textSecondary}`}>({records.length} records)</span>
            </h3>
            {records.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="check_circle" size={48} className="text-emerald-400 mx-auto mb-2" />
                <p className={th.textSecondary}>No violations found for the selected filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${th.border}`}>
                      <th className={`px-4 py-3 text-left font-semibold ${th.textSecondary}`}>Driver</th>
                      <th className={`px-4 py-3 text-left font-semibold ${th.textSecondary}`}>Vehicle</th>
                      <th className={`px-4 py-3 text-left font-semibold ${th.textSecondary}`}>Violation</th>
                      <th className={`px-4 py-3 text-left font-semibold ${th.textSecondary}`}>Date</th>
                      <th className={`px-4 py-3 text-center font-semibold ${th.textSecondary}`}>Penalties</th>
                      <th className={`px-4 py-3 text-center font-semibold ${th.textSecondary}`}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const rankBadge = getRankBadge(record.rank);
                      return (
                        <tr key={record.id} className={`border-b ${th.border} hover:bg-surface-container-low/50`}>
                          <td className="px-4 py-3">
                            <p className={`font-medium ${th.text}`}>{record.driver.name}</p>
                            <p className="text-xs text-on-surface-variant">{record.driver.employeeId}</p>
                          </td>
                          <td className={`px-4 py-3 font-mono ${th.text}`}>{record.vehicle.plateNumber}</td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getViolationColor(record.violationType)}`}>
                              <Icon name={getViolationIcon(record.violationType)} size={14} />
                              {record.violationType}
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${th.textSecondary}`}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${record.penaltyPoints > 5 ? "text-red-500" : record.penaltyPoints > 2 ? "text-amber-500" : "text-emerald-500"}`}>
                              {record.penaltyPoints}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${rankBadge.color}`}>
                              {record.rank} - {rankBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
