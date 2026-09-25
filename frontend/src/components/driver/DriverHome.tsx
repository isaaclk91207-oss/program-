import { Icon, TripStatusPill, CertBadge } from "../ui";
import PassportCard from "./PassportCard";
import type { TransportRequest, Driver, Feedback, DriverTask } from "../../types";

function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={star <= rating ? "star" : "star_border"}
          size={14}
          className={star <= rating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}
          fill={star <= rating}
        />
      ))}
    </div>
  );
}

export default function DriverHome({
  user,
  driverProfile,
  allDrivers,
  feedbacks,
  activeTrips,
  completedTrips,
  tasks,
  onViewTrips,
  onSelectTrip,
  onPassport,
  onCalendar,
}: {
  user: { name: string; id: string };
  driverProfile: Driver | null;
  allDrivers: Driver[];
  feedbacks: Feedback[];
  activeTrips: TransportRequest[];
  completedTrips: TransportRequest[];
  tasks: DriverTask[];
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
        <>
          <button
            onClick={onPassport}
            className="w-full bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] rounded-2xl p-5 text-white shadow-xl text-left transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="badge" size={18} className="text-white/70" />
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-white/70">Driver Passport</span>
              </div>
              <CertBadge level={driverProfile.certLevel} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-headline-md text-headline-md font-bold">{driverProfile.name}</p>
                <p className="font-body-sm text-body-sm text-white/70 font-mono mt-0.5">{driverProfile.id}</p>
              </div>
              <div className="flex gap-5">
                <div className="text-center">
                  <p className="font-stat-lg text-stat-lg font-bold">{driverProfile.score}</p>
                  <p className="font-label-caps text-label-caps uppercase text-white/70">Score</p>
                </div>
                <div className="text-center">
                  <p className="font-stat-lg text-stat-lg font-bold">{driverProfile.rating}</p>
                  <p className="font-label-caps text-label-caps uppercase text-white/70">Rating</p>
                </div>
              </div>
            </div>
          </button>

          {/* Full Passport Card */}
          <PassportCard driver={driverProfile} />
        </>
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

      {/* Passenger Feedback */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">
            Passenger Feedback
          </h3>
          {feedbacks.length > 0 && (
            <span className="text-xs text-on-surface-variant dark:text-outline-variant">
              {feedbacks.length} reviews
            </span>
          )}
        </div>
        {feedbacks.length === 0 ? (
          <div className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-5 text-center">
            <Icon name="rate_review" size={32} className="text-on-surface-variant/50 dark:text-outline-variant/50 mx-auto mb-2" />
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
              No feedback yet. Complete trips to receive passenger reviews.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.slice(0, 3).map((fb) => (
              <div
                key={fb.id}
                className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-role-passenger-container dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="font-body-sm text-body-sm font-semibold text-role-passenger dark:text-blue-400">
                        {initials(fb.passengerName)}
                      </span>
                    </div>
                    <div>
                      <p className="font-title-sm text-title-sm text-on-surface dark:text-white">{fb.passengerName}</p>
                      <p className="font-body-xs text-body-xs text-on-surface-variant dark:text-outline-variant">{fb.department}</p>
                    </div>
                  </div>
                  <StarRating rating={fb.rating} />
                </div>
                {fb.comment && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-2 leading-relaxed">
                    "{fb.comment}"
                  </p>
                )}
                {fb.tags && fb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fb.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-role-passenger/10 text-role-passenger dark:bg-blue-500/20 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Tasks */}
      {tasks && tasks.length > 0 && (
        <div>
          <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant mb-2">
            Active Tasks
          </h3>
          <div className="space-y-2">
            {tasks.filter((t) => t.status === "ACTIVE").map((t) => (
              <div
                key={t.id}
                className="bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface dark:text-white truncate">{t.title}</p>
                    {t.description && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-1 truncate">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant dark:text-outline-variant">
                      {t.vehiclePlate && <span className="font-mono">{t.vehiclePlate}</span>}
                      {t.estimatedDurationMs && (
                        <span>Est: {Math.round((t.estimatedDurationMs / 3600000) * 10) / 10}h</span>
                      )}
                      <span>Started: {new Date(t.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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