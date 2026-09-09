import { Card, Badge, KPICard, ProgressBar, th, Icon } from "../ui";
import type { DashboardStats } from "../../types";
import { formatRequestId } from "../../types";

export default function AdminDashboard({ data }: { data: DashboardStats }) {
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="schedule" size={18} className="text-blue-600" />
            <h3 className="font-semibold text-sm">Total Trip Hours</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{data.totalTripHours || 0}<span className="text-sm font-normal text-slate-500 ml-1">hrs</span></p>
          <p className="text-xs text-slate-400 mt-1">Vehicle check-in → check-out</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="directions_car" size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-sm">Total Driving Hours</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{data.totalActualHours || 0}<span className="text-sm font-normal text-slate-500 ml-1">hrs</span></p>
          <p className="text-xs text-slate-400 mt-1">Passenger pickup → dropoff</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Requests by Status</h3>
          <div className="space-y-2">
            {data.requestsByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className={`text-sm ${th.textSecondary} w-40`}>{s.status.replace(/_/g, " ")}</span>
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
              data.driverHours.map((d) => (
                <div key={d.driverId} className={`flex justify-between items-center py-2 border-b ${th.border} last:border-0`}>
                  <div>
                    <p className={`text-sm font-medium ${th.text}`}>{d.driverName}</p>
                    <p className={`text-xs ${th.textMuted}`}>Trip: {d.tripHours}h · Driving: {d.actualHours}h</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge status="IN_PROGRESS">{d.tripHours}h</Badge>
                  </div>
                </div>
              ))
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
              <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
