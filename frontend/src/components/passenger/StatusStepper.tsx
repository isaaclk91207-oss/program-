import { Check } from "lucide-react";
import { th } from "../ui";

const STEPS = [
  { key: "PENDING", label: "Requested" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "QR_PENDING", label: "QR Ready" },
  { key: "PICK_UP_SCANNED", label: "Picked Up" },
  { key: "IN_PROGRESS", label: "In Transit" },
  { key: "DROP_OFF_SCANNED", label: "Dropped Off" },
  { key: "FEEDBACK_SUBMITTED", label: "Completed" },
];

export default function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-amber-500 border-amber-500 text-navy-950"
                    : `${th.bgInput} ${th.border} ${th.textMuted}`
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <p className={`text-[10px] mt-1 text-center ${
                isCurrent ? "text-amber-600 dark:text-amber-400 font-medium" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : th.textMuted
              }`}>
                {step.label}
              </p>
              {idx < STEPS.length - 1 && (
                <div className={`absolute w-full h-0.5 top-4 ${
                  idx < currentIndex ? "bg-emerald-500" : `${th.bgInput}`
                }`} style={{ zIndex: -1 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
