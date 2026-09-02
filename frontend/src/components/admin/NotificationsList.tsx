import { Card, th } from "../ui";
import { Bell, Check } from "lucide-react";
import type { Notification } from "../../types";

export default function NotificationsList({ notifications }: { notifications: Notification[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
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
