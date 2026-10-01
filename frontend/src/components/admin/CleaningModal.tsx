import { useState } from "react";
import { Button, Input, Modal, Textarea, Icon } from "../ui";
import type { TransportRequest } from "../../types";

interface CleaningModalProps {
  /** Trip context (optional — cleaning is an external, standalone log) */
  request?: TransportRequest | null;
  /** Standalone context: shown when no trip is attached */
  context?: { driverName?: string; vehiclePlate?: string; note?: string };
  /** Prefill for edit mode */
  initialMinutes?: number;
  initialRemark?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (data: { cleaningTimeMs: number; remark?: string }) => Promise<void>;
}

export default function CleaningModal({
  request,
  context,
  initialMinutes,
  initialRemark,
  submitLabel = "Record Cleaning",
  onClose,
  onSubmit,
}: CleaningModalProps) {
  const [cleaningMinutes, setCleaningMinutes] = useState(initialMinutes != null ? String(initialMinutes) : "");
  const [remark, setRemark] = useState(initialRemark || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const c = Number(cleaningMinutes);
    if (!c || c <= 0) {
      setError("Cleaning time (minutes) is required and must be greater than 0");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        cleaningTimeMs: c * 60 * 1000,
        remark: remark.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      const fallback = err instanceof Error && err.message ? err.message : "Failed to record cleaning entry";
      setError(data?.error?.message || data?.message || fallback);
    } finally {
      setSubmitting(false);
    }
  }

  const driverName = request?.driverName || context?.driverName || "driver";
  const plate = request?.vehiclePlate || context?.vehiclePlate || "";
  const hasTrip = !!request;

  return (
    <Modal open title={initialMinutes != null ? "Edit Cleaning Record" : "Record Cleaning Time"} onClose={onClose}>
      <div className="space-y-4">
        {/* Context banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30">
          <Icon name="cleaning_services" size={20} className="text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm">
            <p className="font-medium text-on-surface dark:text-white">
              {initialMinutes != null ? "Edit Cleaning Record" : "External Cleaning Log"}
            </p>
            <p className="text-on-surface-variant dark:text-outline-variant mt-0.5">
              {driverName}
              {plate && (
                <>
                  {" · "}
                  <span className="font-mono">{plate}</span>
                </>
              )}
              {hasTrip && (
                <>
                  <br />
                  {request!.date} {request!.time}
                  <br />
                  {request!.pickup} → {request!.destination}
                </>
              )}
              {!hasTrip && context?.note && <>{context.note}</>}
            </p>
          </div>
        </div>

        {!hasTrip && (
          <p className={`text-xs ${error ? "" : "text-on-surface-variant dark:text-outline-variant"}`}>
            Standalone entry — not linked to any trip or check-in.
          </p>
        )}

        <Input
          label="Cleaning Time (minutes) *"
          value={cleaningMinutes}
          onChange={(e) => setCleaningMinutes(e.target.value)}
          placeholder="e.g. 30"
          type="number"
          min="1"
          autoFocus
        />

        <Textarea
          label="Remark (optional)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Any notes about cleaning..."
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
            {submitting ? "Saving…" : submitLabel}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
