import { useState } from "react";
import { Button, Icon, TripStatusPill } from "../ui";
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
}: {
  trip: TransportRequest;
  onBack: () => void;
}) {
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
        <TripStatusPill status={trip.status} perspective="driver" />
      </div>

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
          </>
        )}
      </div>
    </div>
  );
}