import { useState } from "react";
import { CheckedInChip, EmptyState, Icon, TripStatusPill } from "../ui";
import TripDetail from "./TripDetail";
import type { TransportRequest } from "../../types";
import { formatRequestId } from "../../types";

const ACTIVE_SET = ["ASSIGNED", "PENDING", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"];
const DONE_SET = ["FEEDBACK_SUBMITTED", "COMPLETED", "DROPOFF_COMPLETE"];

type Filter = "all" | "completed" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant block mb-0.5">
        {label}
      </span>
      <span className="font-body-base text-body-base text-on-surface dark:text-white">{value}</span>
    </div>
  );
}

function filterTrips(trips: TransportRequest[], filter: Filter): TransportRequest[] {
  if (filter === "completed") return trips.filter((t) => DONE_SET.includes(t.status));
  if (filter === "cancelled") return trips.filter((t) => !ACTIVE_SET.includes(t.status) && !DONE_SET.includes(t.status));
  return trips;
}

export default function TripsList({
  trips,
  selectedTrip,
  onSelectTrip,
  onBack,
}: {
  trips: TransportRequest[];
  selectedTrip: TransportRequest | null;
  onSelectTrip: (t: TransportRequest | null) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => onSelectTrip(null)} />;
  }

  const visible = filterTrips(trips, filter);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-full text-role-driver dark:text-purple-400 hover:bg-role-driver-container dark:hover:bg-purple-500/20 transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-white">My Trips</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">View and manage your trip records.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-border-hairline dark:border-outline-variant mb-5 overflow-x-auto">
        <div className="flex gap-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 border-b-2 font-title-md text-title-md whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "border-role-driver text-role-driver dark:border-purple-400 dark:text-purple-400"
                  : "border-transparent text-on-surface-variant dark:text-outline-variant hover:text-on-surface dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="hidden sm:flex items-center justify-center p-1 text-on-surface-variant dark:text-outline-variant">
          <Icon name="calendar_month" size={20} />
        </span>
      </div>

      {/* Trip cards */}
      {visible.length === 0 ? (
        <EmptyState message="No trips in this category" />
      ) : (
        <div className="space-y-4">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrip(t)}
              className="w-full text-left bg-surface dark:bg-navy-900 rounded-xl border border-border-hairline dark:border-outline-variant shadow-[0px_1px_3px_0px_rgba(15,23,42,0.05)] p-4 transition-colors hover:border-role-driver/60 dark:hover:border-purple-500/50"
            >
              <div className="flex justify-between items-center border-b border-border-hairline dark:border-outline-variant pb-2 mb-3">
                <div>
                  <span className="font-title-md text-title-md text-on-surface dark:text-white block">
                    {formatRequestId(t.id, t.requestNumber)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant block">
                    {t.date} · {t.time}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TripStatusPill status={t.status} perspective="driver" />
                  {t.hasActiveCheckin && <CheckedInChip />}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <Field label="Route" value={`${t.pickup} → ${t.destination}`} />
                </div>
                <Field label="Passengers" value={t.passengerName} />
                <Field label="Vehicle" value={t.vehiclePlate || "—"} />
                <Field label="Department" value={t.department} />
              </div>
              {["FEEDBACK_SUBMITTED", "COMPLETED", "DROPOFF_COMPLETE"].includes(t.status) && (t.tripHours != null || t.drivingHours != null) && (
                <div className="flex gap-3 mt-2 text-xs text-on-surface-variant dark:text-outline-variant">
                  {t.tripHours != null && <span>Trip: <span className="text-blue-500 font-medium">{t.tripHours}h</span></span>}
                  {t.drivingHours != null && <span>Driving: <span className="text-emerald-500 font-medium">{t.drivingHours}h</span></span>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}