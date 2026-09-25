import { useState } from "react";
import { Button, Input, Modal, Textarea, Icon } from "../ui";
import { adminCheckIn, adminCheckOut } from "../../services/api";
import type { TransportRequest } from "../../types";

export default function CheckInOutModal({
  request,
  mode,
  onClose,
  onDone,
}: {
  request: TransportRequest;
  mode: "in" | "out";
  onClose: () => void;
  onDone: () => void;
}) {
  const [location, setLocation] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkedIn = mode === "in";
  const driverName = request.driverName || "driver";
  const plate = request.vehiclePlate || "";

  async function handleSubmit() {
    if (!location.trim() || !request.driverId || !plate) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = { driverId: request.driverId!, vehiclePlate: plate, location: location.trim(), remark: remark.trim() || undefined };
      if (checkedIn) await adminCheckIn(payload);
      else await adminCheckOut(payload);
      onDone();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      const msg = data?.error?.message || data?.message || (checkedIn ? "Check-in failed" : "Check-out failed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      title={checkedIn ? "Check In Driver" : "Check Out Driver"}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Context banner */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            checkedIn
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
              : "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30"
          }`}
        >
          <Icon
            name={checkedIn ? "login" : "logout"}
            size={20}
            className={checkedIn ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
          />
          <div className="text-sm">
            <p className="font-medium text-on-surface dark:text-white">
              {checkedIn ? "Start driving hours" : "End driving hours"}
            </p>
            <p className="text-on-surface-variant dark:text-outline-variant mt-0.5">
              {driverName} · <span className="font-mono">{plate}</span> · {request.date} {request.time}
            </p>
          </div>
        </div>

        <Input
          label="Location *"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={checkedIn ? "e.g. Main Gate, Parking A" : "e.g. Destination drop-off point"}
          autoFocus
        />
        <Textarea
          label="Remark (optional)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Any notes..."
          rows={2}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-error">
            <Icon name="error" size={16} />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            accent="admin"
            onClick={handleSubmit}
            disabled={!location.trim() || submitting}
            className="flex-1"
          >
            {submitting ? (checkedIn ? "Checking In..." : "Checking Out...") : checkedIn ? "Confirm Check In" : "Confirm Check Out"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
