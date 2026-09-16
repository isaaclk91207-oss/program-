import { Icon, th } from "../ui";
import { getStatusLabel, getStatusProgress, TransportStatus } from "../../lib/status";

const STEPS: { key: TransportStatus; label: string; icon: string; description: string }[] = [
  { key: "PENDING", label: "Requested", icon: "receipt_long", description: "Waiting for assignment" },
  { key: "ASSIGNED", label: "Assigned", icon: "person_add", description: "Driver assigned" },
  { key: "QR_PENDING", label: "QR Ready", icon: "qr_code", description: "Scan to confirm" },
  { key: "PICK_UP_SCANNED", label: "Picked Up", icon: "directions_car", description: "Trip started" },
  { key: "IN_PROGRESS", label: "In Transit", icon: "moving", description: "On the way" },
  { key: "DROP_OFF_SCANNED", label: "Dropped Off", icon: "location_on", description: "Arrived" },
  { key: "FEEDBACK_SUBMITTED", label: "Completed", icon: "check_circle", description: "Trip finished" },
];

export default function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const status = currentStatus as TransportStatus;
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="mb-6">
      <h3 className="font-title-md text-title-md text-on-surface dark:text-white mb-4">Trip Progress</h3>
      
      {/* Horizontal timeline */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-role-passenger to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${getStatusProgress(status)}%` }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="flex items-start justify-between relative">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                {/* Circle with icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-3 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : isCurrent
                      ? "bg-role-passenger border-role-passenger text-white shadow-lg shadow-blue-500/30 animate-pulse"
                      : `bg-white dark:bg-navy-900 border-gray-300 dark:border-gray-600 ${th.textMuted}`
                  }`}
                >
                  {isCompleted ? (
                    <Icon name="check" size={20} className="text-white" />
                  ) : (
                    <Icon name={step.icon} size={20} className={isCurrent ? "text-white" : ""} />
                  )}
                </div>
                
                {/* Label */}
                <p className={`text-xs mt-2 text-center font-medium ${
                  isCurrent 
                    ? "text-role-passenger font-bold" 
                    : isCompleted 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : th.textMuted
                }`}>
                  {step.label}
                </p>
                
                {/* Description (only for current step) */}
                {isCurrent && (
                  <p className="text-[10px] text-on-surface-variant dark:text-outline-variant mt-1 text-center">
                    {step.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status summary */}
      <div className={`mt-6 p-4 rounded-xl border-2 ${
        currentIndex >= 0 
          ? "bg-role-passenger/10 border-role-passenger/30 dark:bg-blue-500/10 dark:border-blue-500/30"
          : `${th.bgCard} ${th.border}`
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentIndex >= 0 
              ? "bg-role-passenger text-white"
              : `${th.bgInput} ${th.textMuted}`
          }`}>
            <Icon name={currentIndex >= 0 ? STEPS[currentIndex]?.icon || "info" : "info"} size={20} />
          </div>
          <div>
            <p className={`font-title-sm text-title-sm ${th.text}`}>
              {currentIndex >= 0 ? STEPS[currentIndex].label : "No Status"}
            </p>
            <p className={`text-sm ${th.textSecondary}`}>
              {currentIndex >= 0 ? STEPS[currentIndex].description : "Awaiting status update"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}