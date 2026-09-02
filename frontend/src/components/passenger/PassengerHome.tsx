import { Card, Badge, th } from "../ui";
import { Plus, MapPin, ArrowRight, Calendar, ClipboardList } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function PassengerHome({
  user,
  requests,
  onNewRequest,
  onViewRequests,
  onViewRequest,
}: {
  user: { name: string };
  requests: TransportRequest[];
  onNewRequest: () => void;
  onViewRequests: () => void;
  onViewRequest: (r: TransportRequest) => void;
}) {
  const activeRequests = requests.filter((r) => !["FEEDBACK_SUBMITTED"].includes(r.status));
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-navy-950">
        <p className="text-sm opacity-80">Welcome back,</p>
        <h2 className="text-xl font-bold">{user.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <ClipboardList className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{activeRequests.length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Active Requests</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{requests.filter((r) => r.status === "FEEDBACK_SUBMITTED").length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Completed</p>
        </Card>
      </div>

      <button onClick={onNewRequest} className="w-full bg-amber-500 hover:bg-amber-600 text-navy-950 font-medium rounded-lg px-4 py-3 text-base transition-colors flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        Request Transport
      </button>

      {recentRequests.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium ${th.textSecondary} mb-2`}>Recent Trips</h3>
          <div className="space-y-2">
            {recentRequests.map((r) => (
              <Card key={r.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onViewRequest(r)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {r.pickup}
                      <ArrowRight className="w-3 h-3" />
                      {r.destination}
                    </div>
                    <p className={`text-xs ${th.textMuted} mt-1`}>{r.date} · {r.time}</p>
                  </div>
                  <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
                </div>
              </Card>
            ))}
          </div>
          <button onClick={onViewRequests} className="text-amber-500 dark:text-amber-400 text-sm mt-2 hover:underline">
            View All →
          </button>
        </div>
      )}
    </div>
  );
}
