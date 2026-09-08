import { Card, Badge, th, Icon } from "../ui";
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
  const completed = requests.filter((r) => r.status === "FEEDBACK_SUBMITTED").length;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Welcome back,</p>
        <h2 className="text-xl font-bold">{user.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <Icon name="receipt_long" size={24} className="text-role-passenger mx-auto mb-1" />
          <p className="text-2xl font-bold text-role-passenger">{activeRequests.length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Active Requests</p>
        </Card>
        <Card className="p-4 text-center">
          <Icon name="check_circle" size={24} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-500">{completed}</p>
          <p className={`text-xs ${th.textSecondary}`}>Completed</p>
        </Card>
      </div>

      <button onClick={onNewRequest} className="w-full bg-role-passenger hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-3 text-base transition-colors flex items-center justify-center gap-2">
        <Icon name="add_circle" size={20} />
        Request Transport
      </button>

      {requests.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium ${th.textSecondary} mb-2`}>Recent Trips</h3>
          <div className="space-y-2">
            {requests.slice(0, 5).map((r) => (
              <Card key={r.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onViewRequest(r)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Icon name="circle" size={6} className="text-on-surface-variant" />
                      {r.pickup}
                      <Icon name="arrow_forward" size={12} className="text-on-surface-variant" />
                      {r.destination}
                    </div>
                    <p className={`text-xs ${th.textMuted} mt-1`}>{r.date} · {r.time}</p>
                  </div>
                  <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
                </div>
              </Card>
            ))}
          </div>
          <button onClick={onViewRequests} className="text-role-passenger text-sm mt-2 hover:underline">
            View All →
          </button>
        </div>
      )}
    </div>
  );
}
