import { Card, th, Icon } from "../ui";
import type { Notification } from "../../types";
import { formatRequestId } from "../../types";

export default function NotificationsList({
  notifications,
  requests,
  onSelectRequest,
  onNavigateToRequests,
  onMarkRead,
}: {
  notifications: Notification[];
  requests?: { id: string; requestNumber?: string }[];
  onSelectRequest?: (r: { id: string }) => void;
  onNavigateToRequests?: () => void;
  onMarkRead?: (id: string) => void;
}) {
  function handleClick(n: Notification) {
    if (!n.read && onMarkRead) onMarkRead(n.id);
    if (n.relatedRequestId && onSelectRequest && onNavigateToRequests) {
      onNavigateToRequests();
      setTimeout(() => onSelectRequest({ id: n.relatedRequestId! }), 100);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`p-3 ${!n.read ? "border-l-4 border-l-emerald-500" : ""} ${n.relatedRequestId ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
            onClick={() => handleClick(n)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.read ? "bg-slate-100 dark:bg-slate-800" : "bg-emerald-50 dark:bg-emerald-500/20"
              }`}>
                {n.read ? (
                  <Icon name="check" size={16} className="text-slate-400" />
                ) : (
                  <Icon name="notifications" size={16} className="text-emerald-500 dark:text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${th.text}`}>{n.title}</p>
                <p className={`text-xs ${th.textSecondary} mt-1`}>{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-xs ${th.textMuted}`}>{n.createdAt}</p>
                  {n.relatedRequestId && (
                    <span className={`text-xs ${th.textMuted} font-mono`}>
                      {formatRequestId(n.relatedRequestId, requests?.find((r) => r.id === n.relatedRequestId)?.requestNumber)}
                    </span>
                  )}
                </div>
              </div>
              {n.relatedRequestId && (
                <Icon name="chevron_right" size={18} className="text-on-surface-variant shrink-0 mt-1" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
