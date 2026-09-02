import { useMemo } from "react";
import { Card, Badge, th } from "../ui";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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
    days.push(<div key={`empty-${i}`} className="h-20" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTrips = tripsByDate[dateStr] || [];
    const isToday = d === today.getDate();

    days.push(
      <div
        key={d}
        className={`h-20 border rounded-lg p-1 overflow-hidden ${
          isToday ? "border-amber-500 bg-amber-500/5" : th.border
        }`}
      >
        <p className={`text-xs font-medium mb-1 ${isToday ? "text-amber-500 dark:text-amber-400" : th.text}`}>
          {d}
        </p>
        <div className="space-y-0.5">
          {dayTrips.slice(0, 2).map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrip(t)}
              className="w-full text-left text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded px-1 py-0.5 truncate"
            >
              {t.time} {t.passengerName}
            </button>
          ))}
          {dayTrips.length > 2 && (
            <p className={`text-[10px] ${th.textMuted}`}>+{dayTrips.length - 2} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-lg font-semibold mb-4">Trip Calendar</h2>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-medium ${th.text}`}>{monthName}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className={`text-center text-xs font-medium ${th.textMuted} py-1`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </Card>
    </div>
  );
}
