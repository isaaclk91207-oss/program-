import { useState, useEffect } from "react";
import { Icon } from "../ui";
import { getDrivingHours } from "../../services/api";
import type { TransportRequest } from "../../types";

function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DriverProfile({
  user,
  trips,
  onBack,
}: {
  user: { name: string; email: string; id?: string };
  trips: TransportRequest[];
  onBack: () => void;
}) {
  const [hours, setHours] = useState<number | null>(null);
  const completed = trips.filter((t) => t.status === "FEEDBACK_SUBMITTED").length;

  useEffect(() => {
    if (user.id) {
      getDrivingHours(user.id).then((data) => {
        if (data.length > 0) setHours(data[0].totalHours);
      }).catch(() => {});
    }
  }, [user.id]);

  return (
    <div className="max-w-[440px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-full text-role-driver dark:text-purple-400 hover:bg-role-driver-container dark:hover:bg-purple-500/20 transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Icon name="directions_car" size={26} className="text-role-driver dark:text-purple-400" />
          <h2 className="font-headline-md text-headline-md font-bold text-role-driver dark:text-purple-400">PCCP Vector</h2>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-role-driver-container dark:bg-purple-500/20 text-role-driver dark:text-purple-400 flex items-center justify-center text-xl font-bold mx-auto mb-3">
          {initials(user.name)}
        </div>
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface dark:text-white">{user.name}</h3>
        <div className="flex items-center justify-center gap-1 font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
          <Icon name="mail" size={16} />
          {user.email}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-surface-container-low dark:bg-navy-900 rounded-xl p-3 border border-border-hairline dark:border-outline-variant">
            <Icon name="directions_car" size={20} className="text-role-driver dark:text-purple-400 mx-auto mb-1" />
            <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white">{trips.length}</p>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Total Trips</p>
          </div>
          <div className="bg-surface-container-low dark:bg-navy-900 rounded-xl p-3 border border-border-hairline dark:border-outline-variant">
            <Icon name="task_alt" size={20} className="text-role-admin dark:text-emerald-400 mx-auto mb-1" />
            <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white">{completed}</p>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Completed</p>
          </div>
          <div className="bg-surface-container-low dark:bg-navy-900 rounded-xl p-3 border border-border-hairline dark:border-outline-variant">
            <Icon name="schedule" size={20} className="text-blue-500 dark:text-blue-400 mx-auto mb-1" />
            <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white">{hours !== null ? hours : "—"}</p>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Driving Hrs</p>
          </div>
        </div>
      </div>
    </div>
  );
}