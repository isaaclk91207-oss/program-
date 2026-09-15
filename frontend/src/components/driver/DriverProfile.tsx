import { useState, useEffect } from "react";
import { Icon } from "../ui";
import { getDrivingHours } from "../../services/api";
import { onTripStatusChanged } from "../../services/socket";
import type { TransportRequest, TripHoursEntry } from "../../types";

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
  const [tripHours, setTripHours] = useState<number | null>(null);
  const [actualHours, setActualHours] = useState<number | null>(null);
  const [perTrip, setPerTrip] = useState<TripHoursEntry[]>([]);
  const completed = trips.filter((t) => t.status === "FEEDBACK_SUBMITTED").length;

  function loadHours() {
    if (user.id) {
      getDrivingHours(user.id).then((data) => {
        if (data.length > 0) {
          setTripHours(data[0].tripHours);
          setActualHours(data[0].actualHours);
          setPerTrip(data[0].trips || []);
        }
      }).catch(() => {});
    }
  }

  useEffect(() => { loadHours(); }, [user.id]);

  useEffect(() => {
    const unsub = onTripStatusChanged((event) => {
      if (event.driverId === user.id) loadHours();
    });
    return unsub;
  }, [user.id]);

  const tripTotal = Math.round(perTrip.reduce((s, t) => s + t.tripHours, 0) * 10) / 10;
  const actualTotal = Math.round(perTrip.reduce((s, t) => s + t.actualHours, 0) * 10) / 10;

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
            <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white">{tripHours !== null ? tripHours : "—"}</p>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Trip Hrs</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="bg-surface-container-low dark:bg-navy-900 rounded-xl p-3 border border-border-hairline dark:border-outline-variant">
            <Icon name="play_arrow" size={20} className="text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white">{actualHours !== null ? actualHours : "—"}</p>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Actual Driving Hrs</p>
          </div>
        </div>
      </div>

      {/* Per-trip breakdown */}
      {perTrip.length > 0 && (
        <div className="mt-5 bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5">
          <h4 className="font-title-md text-title-md font-semibold text-on-surface dark:text-white mb-3">Trip Hours Breakdown</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {perTrip.map((t) => (
              <div key={t.requestId} className="flex justify-between items-center py-2 border-b border-border-hairline dark:border-outline-variant last:border-0">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">{t.route || t.requestId}</p>
                  <p className="text-xs text-on-surface-variant dark:text-outline-variant">{t.tripDate}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  {t.tripHours > 0 && <span className="text-blue-500">{t.tripHours}h trip</span>}
                  {t.actualHours > 0 && <span className="text-emerald-500">{t.actualHours}h actual</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-border-hairline dark:border-outline-variant text-sm font-semibold text-on-surface dark:text-white">
            <span>Total ({perTrip.length} trips)</span>
            <div className="flex gap-2">
              <span className="text-blue-500">{tripTotal}h</span>
              <span className="text-emerald-500">{actualTotal}h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
