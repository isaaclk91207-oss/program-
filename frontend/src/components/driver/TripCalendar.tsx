import { useMemo } from "react";
import { Icon } from "../ui";
import type { TransportRequest } from "../../types";

export default function TripCalendar({
  trips,
  onSelectTrip,
  onBack,
}: {
  trips: TransportRequest[];
  onSelectTrip: (t: TransportRequest) => void;
  onBack: () => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const tripsByDate = useMemo(() => {
    const map: Record<string, TransportRequest[]> = {};
    trips.forEach((t) => {
      const key = t.date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [trips]);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-16 sm:h-20" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTrips = tripsByDate[dateStr] || [];
    const isToday = d === today.getDate();

    days.push(
      <div
        key={d}
        className={`h-16 sm:h-20 border rounded-lg p-1 overflow-hidden transition-colors ${
          isToday
            ? "border-role-driver bg-role-driver-container dark:border-purple-400 dark:bg-purple-500/10"
            : "border-border-hairline dark:border-outline-variant"
        }`}
      >
        <p className={`font-body-sm text-body-sm font-medium mb-1 ${isToday ? "text-role-driver dark:text-purple-400" : "text-on-surface dark:text-white"}`}>
          {d}
        </p>
        <div className="space-y-0.5">
          {dayTrips.slice(0, 2).map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrip(t)}
              className="w-full text-left text-[10px] bg-role-driver-container dark:bg-purple-500/20 text-role-driver dark:text-purple-400 rounded px-1 py-0.5 truncate"
            >
              {t.time} {t.passengerName}
            </button>
          ))}
          {dayTrips.length > 2 && (
            <p className="text-[10px] text-on-surface-variant dark:text-outline-variant">+{dayTrips.length - 2} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-full text-role-driver dark:text-purple-400 hover:bg-role-driver-container dark:hover:bg-purple-500/20 transition-colors"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-white">Trip Calendar</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">{monthName}</p>
        </div>
      </div>

      <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dw) => (
            <div key={dw} className="text-center font-label-caps text-label-caps uppercase text-on-surface-variant dark:text-outline-variant py-1">
              {dw}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    </div>
  );
}