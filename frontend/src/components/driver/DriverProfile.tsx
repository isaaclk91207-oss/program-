import { useState, useEffect } from "react";
import { Icon, HoursCard } from "../ui";
import { getDrivingHours, getDriverTasks, updateDriverTask } from "../../services/api";
import { onTripStatusChanged } from "../../services/socket";
import type { TransportRequest, TripHoursEntry, DriverTask } from "../../types";

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
  const [drivingHours, setDrivingHours] = useState<number | null>(null);
  const [waitingTimeMs, setWaitingTimeMs] = useState<number>(0);
  const [taskHours, setTaskHours] = useState<number>(0);
  const [perTrip, setPerTrip] = useState<TripHoursEntry[]>([]);
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const completed = trips.filter((t) => t.status === "FEEDBACK_SUBMITTED").length;

  function loadHours() {
    if (user.id) {
      getDrivingHours(user.id).then((data) => {
        if (data.length > 0) {
          setTripHours(data[0].tripHours);
          setDrivingHours(data[0].drivingHours);
          setWaitingTimeMs(data[0].waitingTimeMs || 0);
          setTaskHours(data[0].taskHours || 0);
          setPerTrip(data[0].trips || []);
        }
      }).catch(() => {});
    }
  }

  function loadTasks() {
    if (user.id) {
      getDriverTasks(user.id).then((data) => {
        setTasks(data);
      }).catch(() => {});
    }
  }

  useEffect(() => { loadHours(); loadTasks(); }, [user.id]);

  useEffect(() => {
    const unsub = onTripStatusChanged((event) => {
      if (event.driverId === user.id) { loadHours(); loadTasks(); }
    });
    return unsub;
  }, [user.id]);

  const tripTotal = Math.round(perTrip.reduce((s, t) => s + t.tripHours, 0) * 10) / 10;
  const drivingTotal = Math.round(perTrip.reduce((s, t) => s + t.drivingHours, 0) * 10) / 10;

  async function handleCompleteTask(taskId: string) {
    if (!user.id) return;
    try {
      await updateDriverTask(user.id, taskId, { status: "COMPLETED" });
      loadTasks();
      loadHours();
    } catch (err) {
      console.error(err);
    }
  }

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
          <HoursCard type="trip" value={tripHours !== null ? tripHours : "—"} />
          <HoursCard type="driving" value={drivingHours !== null ? drivingHours : "—"} />
          <HoursCard type="waiting" value={waitingTimeMs > 0 ? Math.round((waitingTimeMs / 3600000) * 10) / 10 : "—"} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
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
          <HoursCard type="task" value={taskHours > 0 ? taskHours : "—"} />
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
                  {t.drivingHours > 0 && <span className="text-emerald-500">{t.drivingHours}h driving</span>}
                  {t.waitingTimeMs > 0 && <span className="text-amber-500">{Math.round((t.waitingTimeMs / 3600000) * 10) / 10}h wait</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-border-hairline dark:border-outline-variant text-sm font-semibold text-on-surface dark:text-white">
            <span>Total ({perTrip.length} trips)</span>
            <div className="flex gap-2">
              <span className="text-blue-500">{tripTotal}h</span>
              <span className="text-emerald-500">{drivingTotal}h</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Tasks */}
      {tasks.filter((t) => t.status === "ACTIVE").length > 0 && (
        <div className="mt-5 bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5">
          <h4 className="font-title-md text-title-md font-semibold text-on-surface dark:text-white mb-3">Active Tasks</h4>
          <div className="space-y-2">
            {tasks.filter((t) => t.status === "ACTIVE").map((t) => {
              const estHours = t.estimatedDurationMs ? Math.round((t.estimatedDurationMs / 3600000) * 10) / 10 : null;
              return (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-border-hairline dark:border-outline-variant last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface dark:text-white truncate">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-on-surface-variant dark:text-outline-variant truncate">{t.description}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-on-surface-variant dark:text-outline-variant">
                      {t.vehiclePlate && <span className="font-mono">{t.vehiclePlate}</span>}
                      {estHours !== null && <span>Est: {estHours}h</span>}
                      <span>Started: {new Date(t.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompleteTask(t.id)}
                    className="ml-3 shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
