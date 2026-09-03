import { useState } from "react";
import { th } from "../ui";
import UnitReportView from "./UnitReportView";
import DriverReportView from "./DriverReportView";
import { Car, Users } from "lucide-react";

type ReportTab = "unit" | "driver";

const TABS = [
  { key: "unit" as const, label: "Unit Report", icon: Car, description: "Fuel chart, speed data, and trip summaries for a vehicle" },
  { key: "driver" as const, label: "Driver Report", icon: Users, description: "Driver activity, assignments, and eco driving summary" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("unit");

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                tab === t.key
                  ? "border-amber-500 bg-amber-500/10"
                  : `${th.border} ${th.bgCard} hover:border-slate-300 dark:hover:border-slate-600`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tab === t.key ? "bg-amber-500 text-white" : `${th.bgElevated} ${th.textSecondary}`
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-semibold ${tab === t.key ? "text-amber-600 dark:text-amber-400" : th.text}`}>
                    {t.label}
                  </p>
                  <p className={`text-xs ${th.textMuted}`}>{t.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active view */}
      {tab === "unit" && <UnitReportView />}
      {tab === "driver" && <DriverReportView />}
    </div>
  );
}
