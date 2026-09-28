import { useState } from "react";
import { Button, Input, Modal, Textarea, Icon } from "../ui";
import type { TransportRequest } from "../../types";

interface RedZoneModalProps {
  request: TransportRequest;
  onClose: () => void;
  onSubmit: (data: { cleaningTimeMs: number; waitingTimeMs?: number; remark?: string }) => Promise<void>;
}

export default function RedZoneModal({ request, onClose, onSubmit }: RedZoneModalProps) {
  const [cleaningMinutes, setCleaningMinutes] = useState("");
  const [waitingMinutes, setWaitingMinutes] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const c = Number(cleaningMinutes);
    if (!c || c <= 0) {
      setError("Cleaning time (minutes) is required and must be greater than 0");
      return;
    }
    const w = Number(waitingMinutes);
    if (waitingMinutes && (isNaN(w) || w < 0)) {
      setError("Waiting time must be a valid number");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        cleaningTimeMs: c * 60 * 1000,
        waitingTimeMs: w ? w * 60 * 1000 : undefined,
        remark: remark.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      const msg = data?.error?.message || data?.message || "Failed to record Red Zone entry";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const driverName = request.driverName || "driver";
  const plate = request.vehiclePlate || "";

  return (
    <Modal open title="Record Red Zone Entry" onClose={onClose}>
      <div className="space-y-4">
        {/* Context banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30">
          <Icon name="cleaning_services" size={20} className="text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm">
            <p className="font-medium text-on-surface dark:text-white">Record Cleaning & Red Zone Time</p>
            <p className="text-on-surface-variant dark:text-outline-variant mt-0.5">
              {driverName} · <span className="font-mono">{plate}</span> · {request.date} {request.time}
              <br />
              {request.pickup} → {request.destination}
            </p>
          </div>
        </div>

        <Input
          label="Cleaning Time (minutes) *"
          value={cleaningMinutes}
          onChange={(e) => setCleaningMinutes(e.target.value)}
          placeholder="e.g. 30"
          type="number"
          min="1"
          autoFocus
        />

        <Input
          label="Waiting Time Adjustment (minutes, optional)"
          value={waitingMinutes}
          onChange={(e) => setWaitingMinutes(e.target.value)}
          placeholder="e.g. 15"
          type="number"
          min="0"
        />

        <Textarea
          label="Remark (optional)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Any notes about cleaning or waiting..."
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
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Recording…" : "Record Red Zone"}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}