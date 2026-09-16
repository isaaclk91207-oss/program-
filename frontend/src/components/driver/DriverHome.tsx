import { Icon, TripStatusPill, CertBadge } from "../ui";
import type { TransportRequest, Driver } from "../../types";

function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DriverHome({
  user,
  driverProfile,
  allDrivers,
  activeTrips,
  completedTrips,
  onViewTrips,
  onSelectTrip,
  onPassport,
  onCalendar,
}: {
  user: { name: string; id: string };
  driverProfile: Driver | null;
  allDrivers: Driver[];
  activeTrips: TransportRequest[];
  completedTrips: TransportRequest[];
  onViewTrips: () => void;
  onSelectTrip: (t: TransportRequest) => void;
  onPassport: () => void;
  onCalendar: () => void;
}) {
  const lead = activeTrips[0];

  // Calculate driver rank based on score
  const sortedDrivers = [...allDrivers].sort((a, b) => (b.score || 0) - (a.score || 0));
  const driverRank = sortedDrivers.findIndex((d) => d.id === user.id) + 1;
  const totalDrivers = sortedDrivers.length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">Welcome back</p>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-white">{user.name}</h2>
        </div>
        <div className="w-12 h-12 rounded-full bg-role-driver-container text-role-driver dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center text-lg font-bold">
          {initials(user.name)}
        </div>
      </div>

      {/* Driver Rank Card */}
      {driverRank > 0 && totalDrivers > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Icon name="emoji_events" size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sm opacity-90">Your Ranking</p>
                <p className="text-2xl font-bold">#{driverRank} of {totalDrivers}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Score</p>
              <p className="text-lg font-bold">{driverProfile?.score || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Passport Summary Card */}
      {driverProfile && (
        <button
          onClick={onPassport}
          className="w-full bg-gradient-to-br from-role-driver via-[#6d28d9] to-[#4c1d95] rounded-xl p-4 text-white shadow-lg text-left transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="badge" size={20} className="text-white/80" />
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-white/80">Driver Passport</span>
            </div>
            <CertBadge level={driverProfile.certLevel} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-title-md text-title-md font-semibold">{driverProfile.name}</p>
              <p className="text-sm opacity-80 font-mono">{driverProfile.id}</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-lg font-bold">{driverProfile.score}</p>
                <p className="text-xs opacity-70">Score</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{driverProfile.rating}</p>
                <p className="text-xs opacity-70">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{driverProfile.credits}</p>
                <p className="text-xs opacity-70">Credits</p>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Active assignment highlight */}
      {lead ? (
        <button
          onClick={() => onSelectTrip(lead)}
          className="w-full text-left bg-gradient-to-br from-role-driver to-[#4c1d95] rounded-2xl p-5 text-white shadow-lg transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-white/70">Current Assignment</span>
            <span className="bg-white/20 rounded-full px-3 py-1 font-label-caps text-label-caps uppercase">{lead.status.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon name="route" size={22} fill />
            </span>
            <div className="min-w-0">
              <p className="font-title-md text-title-md text-white font-semibold truncate">
                {lead.pickup} <Icon name="arrow_forward" size={16} className="inline align-middle" /> {lead.destination}
              </p>
              <p className="font-body-sm text-body-sm text-white/75 mt-0.5">
                {lead.passengerName} · {lead.date} {lead.time}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5">
          <p className="font-body-base text-body-base text-on-surface-variant dark:text-outline-variant">
            No active assignments. New trips will appear here.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4">
          <Icon name="assignment" size={24} className="text-role-driver dark:text-purple-400" />
          <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white mt-1">{activeTrips.length}</p>
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Active Trips</p>
        </div>
        <div className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4">
          <Icon name="task_alt" size={24} className="text-role-admin dark:text-emerald-400" />
          <p className="font-stat-lg text-stat-lg text-on-surface dark:text-white mt-1">{completedTrips.length}</p>
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">Completed</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPassport}
          className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4 text-left transition-colors hover:border-role-driver/60 dark:hover:border-purple-500/50"
        >
          <Icon name="badge" size={24} className="text-role-driver dark:text-purple-400 mb-2" />
          <p className="font-title-md text-title-md text-on-surface dark:text-white">My Passport</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">Certification & QR</p>
        </button>
        <button
          onClick={onCalendar}
          className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4 text-left transition-colors hover:border-role-driver/60 dark:hover:border-purple-500/50"
        >
          <Icon name="calendar_month" size={24} className="text-role-driver dark:text-purple-400 mb-2" />
          <p className="font-title-md text-title-md text-on-surface dark:text-white">Calendar</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">View trip schedule</p>
        </button>
      </div>

      {/* Active trips list */}
      {activeTrips.length > 1 && (
        <div>
          <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant mb-2">
            All Active Trips
          </h3>
          <div className="space-y-2">
            {activeTrips.slice(1, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTrip(t)}
                className="w-full bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4 text-left transition-colors hover:border-role-driver/60 dark:hover:border-purple-500/50"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface dark:text-white">{t.passengerName}</p>
                    <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-0.5 truncate">
                      <Icon name="location_on" size={14} />
                      {t.pickup}
                      <Icon name="arrow_forward" size={14} />
                      {t.destination}
                    </div>
                  </div>
                  <TripStatusPill status={t.status} perspective="driver" />
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={onViewTrips}
            className="mt-3 font-title-md text-title-md text-role-driver dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            View All <Icon name="arrow_forward" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}