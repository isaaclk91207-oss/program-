import { Icon, th } from "../ui";

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

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-role-passenger border-role-passenger text-white"
                    : `${th.bgInput} ${th.border} ${th.textMuted}`
                }`}
              >
                {isCompleted ? <Icon name="check" size={16} className="text-white" /> : idx + 1}
              </div>
              <p className={`text-[10px] mt-1 text-center ${
                isCurrent ? "text-role-passenger font-medium" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : th.textMuted
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
