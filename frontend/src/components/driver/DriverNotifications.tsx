import { EmptyState, Icon } from "../ui";
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
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full text-role-driver dark:text-purple-400 hover:bg-role-driver-container dark:hover:bg-purple-500/20 transition-colors"
          >
            <Icon name="arrow_back" size={24} />
          </button>
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-white">Notifications</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
              {unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        <button
          onClick={onMarkAllRead}
          className="font-title-md text-title-md text-role-driver dark:text-purple-400 hover:underline"
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="No notifications" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4 flex items-start gap-3 ${
                !n.read ? "ring-1 ring-role-driver/40 dark:ring-purple-400/30" : ""
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  n.read
                    ? "bg-surface-container-low dark:bg-navy-900 text-on-surface-variant dark:text-outline-variant"
                    : "bg-role-driver-container dark:bg-purple-500/20 text-role-driver dark:text-purple-400"
                }`}
              >
                <Icon name={n.read ? "notifications_none" : "notifications"} size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-title-md text-title-md text-on-surface dark:text-white truncate">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-error dark:bg-rose-500 shrink-0" />}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-0.5">{n.message}</p>
                <p className="font-label-caps text-label-caps uppercase text-on-surface-variant/70 dark:text-outline-variant/70 mt-1.5">
                  {n.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}