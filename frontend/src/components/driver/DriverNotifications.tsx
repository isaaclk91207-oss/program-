import { Card, EmptyState, th } from "../ui";
import { ArrowLeft, Bell, Check } from "lucide-react";
import type { Notification } from "../../types";

export default function DriverNotifications({
  notifications,
  onBack,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onBack: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-amber-500 dark:text-amber-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <button onClick={onMarkAllRead} className="text-amber-500 dark:text-amber-400 text-xs hover:underline">
          Mark all read
        </button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState message="No notifications" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-3 ${!n.read ? "border-l-4 border-l-amber-500" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  n.read ? "bg-slate-100 dark:bg-slate-800" : "bg-amber-100 dark:bg-amber-500/20"
                }`}>
                  {n.read ? (
                    <Check className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${th.text}`}>{n.title}</p>
                  <p className={`text-xs ${th.textSecondary} mt-1`}>{n.message}</p>
                  <p className={`text-xs ${th.textMuted} mt-1`}>{n.createdAt}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
