import { useState } from "react";
import { ArrivedChip, CheckedInChip, Icon, TripStatusPill, Button } from "../ui";
import { RedZoneModal } from "../admin";
import { recordRedZone } from "../../services/api";
import { useToast } from "../../components/ui";
import type { TransportRequest } from "../../types";
import { formatRequestId } from "../../types";

function InfoRow({ icon, label, value, valueClass = "" }: { icon: string; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-role-driver-container dark:bg-purple-500/20 text-role-driver dark:text-purple-400 flex items-center justify-center shrink-0">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant">{label}</p>
        <p className={`font-body-base text-body-base text-on-surface dark:text-white ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function TripDetail({
  trip,
  onBack,
  onMarkArrived,
}: {
  trip: TransportRequest;
  onBack: () => void;
  onMarkArrived?: (id: string) => Promise<void>;
}) {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [showRedZone, setShowRedZone] = useState(false);
  const [redZoneError, setRedZoneError] = useState<string | null>(null);
  const { addToast } = useToast();
  const canArrive = (trip.status === "ASSIGNED" || trip.status === "QR_PENDING") && !trip.arrivedAt;
  const hasRedZone = (trip.redZoneCleaningMs || 0) > 0 || (trip.redZoneWaitingMs || 0) > 0;
  const canRecordRedZone = ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"].includes(trip.status) && !hasRedZone;

  async function handleMarkArrived() {
    if (!onMarkArrived || marking) return;
    setMarking(true);
    setMarkError(null);
    try {
      await onMarkArrived(trip.id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setMarkError(axiosErr.response?.data?.error?.message || "Could not mark arrival. Try again.");
    } finally {
      setMarking(false);
    }
  }

  async function handleRecordRedZone(data: { cleaningTimeMs: number; waitingTimeMs?: number; remark?: string }) {
    try {
      await recordRedZone(trip.id, data);
      addToast("success", "Red Zone entry recorded");
      setShowRedZone(false);
      setRedZoneError(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.error?.message || "Failed to record Red Zone";
      setRedZoneError(msg);
      throw err;
    }
  }

  return (
    <div className="max-w-[440px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-full text-role-driver dark:text-purple-400 hover:bg-role-driver-container dark:hover:bg-purple-500/20 transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div className="flex-1">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface dark:text-white">
            {formatRequestId(trip.id, trip.requestNumber)}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
            {trip.date} · {trip.time}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <TripStatusPill status={trip.status} perspective="driver" />
          {trip.arrivedAt && <ArrivedChip arrivedAt={trip.arrivedAt} />}
          {trip.hasActiveCheckin && <CheckedInChip />}
        </div>
      </div>

      {/* Arrival */}
      {canArrive && (
        <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-4">
          <button
            onClick={handleMarkArrived}
            disabled={marking || !onMarkArrived}
            className="w-full py-3 rounded-xl bg-role-driver hover:bg-purple-700 disabled:opacity-60 text-white font-title-md text-title-md transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="location_on" size={18} />
            {marking ? "Sending…" : "I've arrived at pickup"}
          </button>
          {markError && <p className="mt-2 text-sm text-red-500 text-center">{markError}</p>}
        </div>
      )}
      {trip.arrivedAt && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50/70 dark:bg-sky-500/10 dark:border-sky-500/30">
          <span className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Icon name="where_to_vote" size={18} />
          </span>
          <div className="min-w-0">
            <p className="font-label-caps text-label-caps uppercase text-sky-700 dark:text-sky-400">Arrived at pickup</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
              {new Date(trip.arrivedAt).toLocaleString()} · waiting for admin check-in
            </p>
          </div>
        </div>
      )}

      {/* Route card */}
      <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5">
        <div className="space-y-4">
          <div>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant mb-1">Pickup</p>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-3 h-3 rounded-full bg-role-admin dark:bg-emerald-400 shrink-0" />
              <p className="font-body-base text-body-base font-medium text-on-surface dark:text-white">{trip.pickup}</p>
            </div>
          </div>
          <div className="w-px h-5 ml-[5px] bg-border-hairline dark:bg-outline-variant" />
          <div>
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant mb-1">
              Destination
            </p>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 w-3 h-3 rounded-full bg-role-driver dark:bg-purple-400 shrink-0" />
              <p className="font-body-base text-body-base font-medium text-on-surface dark:text-white">{trip.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5 space-y-4">
        <InfoRow icon="person" label="Passenger" value={trip.passengerName} />
        <InfoRow icon="business" label="Department" value={trip.department} />
        <InfoRow icon="calendar_month" label="Date" value={trip.date} />
        <InfoRow icon="schedule" label="Time" value={trip.time} />
        <InfoRow icon="directions_car" label="Vehicle" value={trip.vehiclePlate || "—"} valueClass="font-mono" />
        {trip.hasActiveCheckin && (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-500/10 dark:border-emerald-500/30">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Icon name="login" size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-label-caps text-label-caps uppercase text-emerald-700 dark:text-emerald-400">Checked In</p>
              <p className="font-body-base text-body-base text-on-surface dark:text-white">
                {trip.vehiclePlate ? <span className="font-mono">{trip.vehiclePlate}</span> : "Vehicle"}
                {trip.activeCheckin?.checkInTime && (
                  <> · {new Date(trip.activeCheckin.checkInTime).toLocaleString()}</>
                )}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
                {trip.activeCheckin?.checkInLocation ? `${trip.activeCheckin.checkInLocation} · ` : ""}
                {trip.activeCheckin?.checkedBy === "DRIVER" ? "Checked in by Driver" : "Checked in by Admin"}
                {" · driving hours running"}
              </p>
            </div>
          </div>
        )}
        {["FEEDBACK_SUBMITTED", "COMPLETED", "DROPOFF_COMPLETE"].includes(trip.status) && (trip.tripHours != null || trip.drivingHours != null) && (
          <>
            {trip.tripHours != null && (
              <InfoRow icon="schedule" label="Trip Hours" value={`${trip.tripHours}h`} valueClass="text-blue-500 font-bold" />
            )}
            {trip.drivingHours != null && (
              <InfoRow icon="play_arrow" label="Driving Hours" value={`${trip.drivingHours}h`} valueClass="text-emerald-500 font-bold" />
            )}
            {(trip.waitingTimeMs || 0) > 0 && (
              <InfoRow icon="hourglass_top" label="Waiting Time" value={`${Math.round((trip.waitingTimeMs || 0) / 3600000 * 10) / 10}h`} valueClass="text-amber-500 font-bold" />
            )}
            {(trip.redZoneCleaningMs || 0) > 0 && (
              <InfoRow icon="cleaning_services" label="Red Zone Cleaning" value={`${Math.round((trip.redZoneCleaningMs || 0) / 3600000 * 10) / 10}h`} valueClass="text-emerald-500 font-bold" />
            )}
            {(trip.redZoneWaitingMs || 0) > 0 && (
              <InfoRow icon="hourglass_top" label="Red Zone Waiting" value={`${Math.round((trip.redZoneWaitingMs || 0) / 3600000 * 10) / 10}h`} valueClass="text-amber-500 font-bold" />
            )}
          </>
        )}
        {canRecordRedZone && (
          <div className="flex gap-3 pt-2">
            <Button
              accent="admin"
              onClick={() => setShowRedZone(true)}
              className="flex-1"
            >
              <Icon name="cleaning_services" size={18} className="mr-2" />
              Record Red Zone
            </Button>
          </div>
        )}
        {showRedZone && (
          <RedZoneModal
            request={trip}
            onClose={() => { setShowRedZone(false); setRedZoneError(null); }}
            onSubmit={handleRecordRedZone}
          />
        )}
      </div>
    </div>
  );
}
