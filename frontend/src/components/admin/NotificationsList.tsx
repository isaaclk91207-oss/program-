import { Card, th, Icon } from "../ui";
import type { Notification } from "../../types";

export default function NotificationsList({ notifications }: { notifications: Notification[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={`p-3 ${!n.read ? "border-l-4 border-l-emerald-500" : ""}`}>
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
                <p className={`text-xs ${th.textMuted} mt-1`}>{n.createdAt}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
