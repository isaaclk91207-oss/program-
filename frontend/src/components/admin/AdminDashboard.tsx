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

      <Card className="p-4 mb-6">
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
