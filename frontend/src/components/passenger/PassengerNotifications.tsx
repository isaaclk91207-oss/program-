import { Card, EmptyState, th, Icon, Badge } from "../ui";
import type { Notification, TransportRequest } from "../../types";

function parseAssignment(message: string): Record<string, string> | null {
  if (!message || !message.includes("Driver:")) return null;
  const pick = (label: string) => {
    const re = new RegExp(`${label}:\\s*([^|]*?)\\s*(?:\\||$)`);
    const m = message.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    driver: pick("Driver"),
    contact: pick("Contact"),
    carNumber: pick("Car Number"),
    request: pick("Request"),
    from: pick("From"),
    to: pick("To"),
    when: pick("date"),
  };
}

export default function PassengerNotifications({
  notifications,
  requests,
  onBack,
  onMarkAllRead,
}: {
  notifications: Notification[];
  requests: TransportRequest[];
  onBack: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-role-passenger">
            <Icon name="arrow_back" size={18} />
          </button>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <button onClick={onMarkAllRead} className="text-role-passenger text-xs hover:underline">
          Mark all read
        </button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState message="No notifications" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const parsed = parseAssignment(n.message);
            const isAssignment = parsed !== null && n.title.toLowerCase().includes("assigned");
            return (
              <Card key={n.id} className={`p-3 ${!n.read ? "border-l-4 border-l-blue-500" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.read ? "bg-surface-container-high" : "bg-blue-500/10"
                  }`}>
                    {n.read ? (
                      <Icon name="check" size={16} className="text-on-surface-variant" />
                    ) : (
                      <Icon name={isAssignment ? "directions_car" : "notifications"} size={16} className="text-role-passenger" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${th.text}`}>{n.title}</p>
                      <span className={`text-[10px] ${th.textMuted} shrink-0`}>{n.createdAt}</span>
                    </div>

                    {isAssignment && parsed ? (
                      <div className={`mt-2 rounded-lg ${th.bgInput} p-3 space-y-1.5 text-xs`}>
                        <div className="flex items-center gap-2">
                          <Icon name="person" size={14} className={th.textSecondary} />
                          <span className={th.textSecondary}>Driver</span>
                          <span className={`${th.text} font-medium`}>{parsed.driver || "—"}</span>
                          {parsed.contact && <span className={`${th.text} flex items-center gap-1`}><Icon name="phone" size={12} />{parsed.contact}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="directions_car" size={14} className={th.textSecondary} />
                          <span className={th.textSecondary}>Car Number</span>
                          <span className={`${th.text} font-mono font-medium`}>{parsed.carNumber || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="route" size={14} className={th.textSecondary} />
                          <span className={th.textSecondary}>Trip</span>
                          <span className={th.text}>
                            {parsed.request && <span className="font-mono">{parsed.request} · </span>}
                            {parsed.from} → {parsed.to}
                          </span>
                        </div>
                        {parsed.when && (
                          <div className="flex items-center gap-2">
                            <Icon name="calendar_today" size={14} className={th.textSecondary} />
                            <span className={th.textSecondary}>When</span>
                            <span className={th.text}>{parsed.when}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className={`text-xs ${th.textSecondary} mt-1`}>{n.message}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
