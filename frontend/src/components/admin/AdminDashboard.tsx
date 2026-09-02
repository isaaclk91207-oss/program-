import { Card, Badge, KPICard, ProgressBar, th } from "../ui";
import { ClipboardList, Clock, Navigation, CheckCircle, Car, Truck, Star, QrCode } from "lucide-react";
import type { DashboardStats } from "../../types";

export default function AdminDashboard({ data }: { data: DashboardStats }) {
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Requests" value={data.totalRequests} icon={<ClipboardList className="w-5 h-5" />} color="amber" />
        <KPICard label="Pending" value={data.pendingRequests} icon={<Clock className="w-5 h-5" />} color="blue" />
        <KPICard label="In Progress" value={data.inProgressRequests} icon={<Navigation className="w-5 h-5" />} color="purple" />
        <KPICard label="Completed" value={data.completedRequests} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
        <KPICard label="Active Drivers" value={data.activeDrivers} icon={<Car className="w-5 h-5" />} color="cyan" />
        <KPICard label="Total Vehicles" value={data.totalVehicles} icon={<Truck className="w-5 h-5" />} color="amber" />
        <KPICard label="Feedback" value={data.feedbackSubmittedRequests} icon={<Star className="w-5 h-5" />} color="emerald" />
        <KPICard label="QR Pending" value={data.qrPendingRequests} icon={<QrCode className="w-5 h-5" />} color="purple" />
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
                <p className={`text-sm ${th.text}`}>{r.id} · {r.passengerName}</p>
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
