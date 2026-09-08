import { useState, useEffect } from "react";
import { Card, Button, LoadingSpinner, th, Icon } from "../ui";
import api from "../../services/api";
import { getDriverReport } from "../../services/api";
import type { DriverReportResponse } from "../../types";

interface DriverOption {
  id: string;
  name: string;
  employeeId: string;
  status: string;
}

export default function DriverReportView() {
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driverId, setDriverId] = useState("");
  const [timeFrom, setTimeFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [timeTo, setTimeTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DriverReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/reports/drivers")
      .then((res) => setDrivers(res.data))
      .catch(() => {});
  }, []);

  const toUnix = (dateStr: string) => Math.floor(new Date(dateStr + "T00:00:00").getTime() / 1000);

  const handleFetch = async () => {
    if (!driverId) { setError("Driver is required"); return; }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await getDriverReport(driverId, {
        timeFrom: toUnix(timeFrom),
        timeTo: toUnix(timeTo),
      });
      setReport(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(apiErr.response?.data?.error?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <h3 className={`text-lg font-semibold ${th.text} mb-4 flex items-center gap-2`}>
          <Icon name="people" size={20} /> Driver Report
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${th.textSecondary} mb-1`}>Driver</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${th.border} ${th.bgInput} ${th.text} text-sm`}>
              <option value="">Select a driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.employeeId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${th.textSecondary} mb-1`}>From Date</label>
            <input type="date" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${th.border} ${th.bgInput} ${th.text} text-sm`} />
          </div>
          <div>
            <label className={`block text-sm font-medium ${th.textSecondary} mb-1`}>To Date</label>
            <input type="date" value={timeTo} onChange={(e) => setTimeTo(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${th.border} ${th.bgInput} ${th.text} text-sm`} />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <Button accent="admin" onClick={handleFetch} loading={loading} className="w-full">
              <Icon name="search" size={16} /> Fetch Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Icon name="error" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Results */}
      {report && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div><span className={`${th.textMuted}`}>Driver:</span> <span className={`font-medium ${th.text}`}>{String(report.driverId).substring(0, 8)}...</span></div>
              <div><span className={`${th.textMuted}`}>Template:</span> <span className={`font-medium ${th.text}`}>{report.templateName}</span></div>
              <div><span className={`${th.textMuted}`}>Period:</span> <span className={`font-medium ${th.text}`}>{timeFrom} → {timeTo}</span></div>
              <div><span className={`${th.textMuted}`}>Tables:</span> <span className={`font-medium ${th.text}`}>{report.tables.length}</span></div>
            </div>
          </Card>

          {/* Tables */}
          {report.tables.map((table) => (
            <Card key={table.tableIndex} className="overflow-hidden">
              <div className={`px-4 py-3 border-b ${th.border} flex items-center justify-between`}>
                <h4 className={`font-semibold ${th.text}`}>{table.tableName}</h4>
                <span className={`text-sm ${th.textMuted}`}>{table.rowCount} rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${th.bgElevated}`}>
                      {table.header.map((col) => (
                        <th key={col} className={`px-4 py-2 text-left font-medium ${th.textSecondary} border-b ${th.border}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, idx) => (
                      <tr key={idx} className={`border-b ${th.border} hover:bg-emerald-500/5`}>
                        {table.header.map((col) => (
                          <td key={col} className={`px-4 py-2 ${th.text}`}>
                            {String(row[col] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {table.rowCount === 0 && (
                <div className={`p-8 text-center ${th.textMuted}`}>No data for this period</div>
              )}
            </Card>
          ))}

          {report.tables.length === 0 && (
            <Card className="p-8 text-center">
              <p className={`${th.textMuted}`}>No tables returned for this report</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
