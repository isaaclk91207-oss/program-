import { useState } from "react";
import { Card, Badge, KPICard, ProgressBar, th, Icon } from "../ui";
import type { DashboardStats } from "../../types";
import { formatRequestId } from "../../types";
import { getStatusLabel } from "../../lib/status";

export default function AdminDashboard({ data }: { data: DashboardStats }) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  return (
    <div>
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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="schedule" size={18} className="text-blue-600" />
            <h3 className="font-semibold text-sm">Trip Hours</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{data.totalTripHours || 0}<span className="text-sm font-normal text-slate-500 ml-1">hrs</span></p>
          <p className="text-xs text-slate-400 mt-1">Manual check-in → check-out</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="directions_car" size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-sm">Actual Hours</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{data.totalActualHours || 0}<span className="text-sm font-normal text-slate-500 ml-1">hrs</span></p>
          <p className="text-xs text-slate-400 mt-1">Passenger QR pickup → dropoff</p>
        </Card>

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
                    <button
                      onClick={() => setExpandedDriver(isExpanded ? null : d.driverId)}
                      className={`w-full text-left flex justify-between items-center py-2 border-b ${th.border} last:border-0`}
                    >
                      <div>
                        <p className={`text-sm font-medium ${th.text}`}>{d.driverName}</p>
                        <p className={`text-xs ${th.textMuted}`}>
                          Trip: {d.tripHours}h · QR: {d.actualHours}h
                        </p>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Badge status="IN_PROGRESS">{d.actualHours || d.tripHours || 0}h</Badge>
                        <Icon name={isExpanded ? "expand_less" : "expand_more"} size={18} className={`${th.textMuted}`} />
                      </div>
                    </button>
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
                              {t.actualHours > 0 && <span className="text-emerald-500">{t.actualHours}h</span>}
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
