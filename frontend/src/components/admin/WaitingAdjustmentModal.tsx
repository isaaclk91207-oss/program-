import { useState } from "react";
import { Button, Input, Modal, Textarea, Icon } from "../ui";
import type { TransportRequest } from "../../types";

interface WaitingAdjustmentModalProps {
  request: TransportRequest;
  onClose: () => void;
  onSubmit: (data: { waitingTimeMs: number; remark?: string }) => Promise<void>;
}

export default function WaitingAdjustmentModal({ request, onClose, onSubmit }: WaitingAdjustmentModalProps) {
  const [waitingMinutes, setWaitingMinutes] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const w = Number(waitingMinutes);
    if (!w || w <= 0) {
      setError("Waiting time (minutes) is required and must be greater than 0");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        waitingTimeMs: w * 60 * 1000,
        remark: remark.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      const msg = data?.error?.message || data?.message || "Failed to record waiting adjustment";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const driverName = request.driverName || "driver";
  const plate = request.vehiclePlate || "";

  return (
    <Modal open title="Record Waiting Adjustment" onClose={onClose}>
      <div className="space-y-4">
        {/* Context banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30">
          <Icon name="warning" size={20} className="text-rose-600 dark:text-rose-400" />
          <div className="text-sm">
            <p className="font-medium text-on-surface dark:text-white">Record Waiting Time Adjustment</p>
            <p className="text-on-surface-variant dark:text-outline-variant mt-0.5">
              {driverName} · <span className="font-mono">{plate}</span> · {request.date} {request.time}
              <br />
              {request.pickup} → {request.destination}
            </p>
          </div>
        </div>

        <Input
          label="Waiting Time Adjustment (minutes) *"
          value={waitingMinutes}
          onChange={(e) => setWaitingMinutes(e.target.value)}
          placeholder="e.g. 15"
          type="number"
          min="1"
          autoFocus
        />

        <Textarea
          label="Remark (optional)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Reason for waiting time adjustment..."
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
            {submitting ? "Recording…" : "Record Adjustment"}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}