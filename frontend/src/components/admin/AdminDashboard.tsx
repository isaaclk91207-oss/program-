import { useState } from "react";
import { Card, Badge, KPICard, ProgressBar, th, Icon, HoursCard, Button } from "../ui";
import type { DashboardStats } from "../../types";
import { formatRequestId } from "../../types";
import { getStatusLabel } from "../../lib/status";

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function AdminDashboard({ data, month, onMonthChange, onSelectDriver }: { data: DashboardStats; month: string; onMonthChange: (m: string) => void; onSelectDriver: (driverId: string) => void }) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div className="flex items-end gap-2">
          <div>
            <label className={`block text-xs font-medium ${th.textSecondary} mb-1`}>Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className={`px-3 py-2 text-sm rounded-lg border ${th.border} ${th.bgInput} ${th.text}`}
            />
          </div>
          {month && (
            <Button variant="secondary" size="sm" onClick={() => onMonthChange("")}>
              All months
            </Button>
          )}
        </div>
        <span className={`text-xs pb-2 ${th.textMuted}`}>
          {month ? `Showing ${formatMonth(month)} data` : "Showing all-time data"}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Requests" value={data.totalRequests} icon={<Icon name="assignment" size={20} />} color="emerald" />
        <KPICard label="Pending" value={data.pendingRequests} icon={<Icon name="schedule" size={20} />} color="blue" />
        <KPICard label="In Progress" value={data.inProgressRequests} icon={<Icon name="navigation" size={20} />} color="purple" />
        <KPICard label="Completed" value={data.completedRequests} icon={<Icon name="check_circle" size={20} />} color="emerald" />
        <KPICard label="Active Drivers" value={data.activeDrivers} icon={<Icon name="directions_car" size={20} />} color="cyan" />
        <KPICard label="Total Vehicles" value={data.totalVehicles} icon={<Icon name="local_shipping" size={20} />} color="emerald" />
        <KPICard label="Feedback" value={data.feedbackSubmittedRequests} icon={<Icon name="star" size={20} />} color="emerald" />
        <KPICard label="QR Pending" value={data.qrPendingRequests} icon={<Icon name="qr_code" size={20} />} color="purple" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <HoursCard type="trip" value={data.totalTripHours || 0} />
        <HoursCard type="driving" value={data.totalDrivingHours || 0} />
        <HoursCard type="waiting" value={Math.round((data.totalWaitingTimeMs || 0) / 3600000 * 10) / 10} />
        <HoursCard type="task" value={data.totalTaskHours || 0} />
        <HoursCard type="cleaning" value={data.totalCleaningHours || 0} />
        <HoursCard type="redzone" value={data.totalRedZoneHours || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Requests by Status</h3>
          <div className="space-y-2">
            {data.requestsByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className={`text-sm ${th.textSecondary} w-40`}>{getStatusLabel(s.status as any, "admin")}</span>
                <div className="flex-1">
                  <ProgressBar value={s.count} max={data.totalRequests || 1} />
                </div>
                <span className={`text-sm font-medium w-8 text-right ${th.text}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Driver Hours</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.driverHours && data.driverHours.length > 0 ? (
              data.driverHours.map((d) => {
                const isExpanded = expandedDriver === d.driverId;
                return (
                  <div key={d.driverId}>
                    <div
                      onClick={() => onSelectDriver(d.driverId)}
                      title={`View ${d.driverName}'s details`}
                      className={`w-full text-left flex justify-between items-center py-2 px-1 -mx-1 rounded-lg cursor-pointer hover:bg-emerald-500/10 transition-colors border-b ${th.border} last:border-0`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${th.text} flex items-center gap-1`}>
                          {d.driverName}
                          <Icon name="chevron_right" size={16} className={th.textMuted} />
                        </p>
                        <p className={`text-xs ${th.textMuted}`}>
                          Trip: {d.tripHours}h · Driving: {d.drivingHours}h · Waiting: {Math.round((d.waitingTimeMs || 0) / 3600000 * 10) / 10}h · Tasks: {d.taskHours || 0}h · Cleaning: {d.cleaningHours || 0}h · Red Zone: {d.redZoneHours || 0}h
                        </p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Badge status="IN_PROGRESS">{d.tripHours || d.drivingHours || 0}h</Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedDriver(isExpanded ? null : d.driverId); }}
                          title={isExpanded ? "Collapse trips" : "Expand trips"}
                          className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${th.textMuted}`}
                        >
                          <Icon name={isExpanded ? "expand_less" : "expand_more"} size={18} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && d.trips && d.trips.length > 0 && (
                      <div className="pl-4 pb-2">
                        {d.trips.map((t) => (
                          <div key={t.requestId} className={`flex justify-between items-center py-1 text-xs border-b ${th.border} last:border-0`}>
                            <div>
                              <span className={`${th.text}`}>{t.route || t.requestId}</span>
                              <span className={`${th.textSecondary} ml-2`}>{t.tripDate}</span>
                            </div>
                            <div className="flex gap-2">
                              {t.tripHours > 0 && <span className="text-blue-500">{t.tripHours}h</span>}
                              {t.drivingHours > 0 && <span className="text-emerald-500">{t.drivingHours}h</span>}
                              {t.waitingTimeMs > 0 && <span className="text-amber-500">{Math.round((t.waitingTimeMs || 0) / 3600000 * 10) / 10}h wait</span>}
                              {t.redZoneCleaningMs > 0 && <span className="text-emerald-500">{Math.round((t.redZoneCleaningMs || 0) / 3600000 * 10) / 10}h clean</span>}
                              {t.redZoneWaitingMs > 0 && <span className="text-rose-500">{Math.round((t.redZoneWaitingMs || 0) / 3600000 * 10) / 10}h wait adj</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No driving hours recorded yet</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Recent Requests</h3>
        <div className="space-y-2">
          {data.recentRequests.slice(0, 5).map((r) => (
            <div key={r.id} className={`flex justify-between items-center py-2 border-b ${th.border} last:border-0`}>
              <div>
                <p className={`text-sm ${th.text}`}>{formatRequestId(r.id, r.requestNumber)} · {r.passengerName}</p>
                <p className={`text-xs ${th.textMuted}`}>{r.pickup} → {r.destination}</p>
              </div>
              <Badge status={r.status}>{getStatusLabel(r.status as any, "admin")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
