import { useState } from "react";
import { Card, Button, LoadingSpinner, th } from "../ui";
import { getUnitReport } from "../../services/api";
import { Car, Search, AlertCircle } from "lucide-react";
import type { UnitReportResponse } from "../../types";

export default function UnitReportView() {
  const [unitId, setUnitId] = useState("");
  const [templateId, setTemplateId] = useState(24);
  const [timeFrom, setTimeFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [timeTo, setTimeTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<UnitReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toUnix = (dateStr: string) => Math.floor(new Date(dateStr + "T00:00:00").getTime() / 1000);

  const handleFetch = async () => {
    if (!unitId) { setError("Unit ID is required"); return; }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await getUnitReport(parseInt(unitId, 10), {
        templateId,
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
          <Car className="w-5 h-5 text-amber-500" /> Unit Report
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${th.textSecondary} mb-1`}>Unit ID (Wialon)</label>
            <input type="number" value={unitId} onChange={(e) => setUnitId(e.target.value)}
              placeholder="e.g. 5731"
              className={`w-full px-3 py-2 rounded-lg border ${th.border} ${th.bgInput} ${th.text} text-sm`} />
          </div>
          <div>
            <label className={`block text-sm font-medium ${th.textSecondary} mb-1`}>Report Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(parseInt(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${th.border} ${th.bgInput} ${th.text} text-sm`}>
              <option value={24}>Fuel Chart (24)</option>
              <option value={8}>Speed Chart (8)</option>
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
          <div className="flex items-end">
            <Button onClick={handleFetch} loading={loading} className="w-full">
              <Search className="w-4 h-4 mr-1" /> Fetch Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
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
              <div><span className={`${th.textMuted}`}>Unit:</span> <span className={`font-medium ${th.text}`}>{report.unitId}</span></div>
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
                      <tr key={idx} className={`border-b ${th.border} hover:bg-amber-500/5`}>
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
