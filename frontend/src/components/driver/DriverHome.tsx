import { Card, Badge, th } from "../ui";
import { Car, MapPin, ArrowRight, ClipboardCheck, ShieldCheck, Calendar, Star } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function DriverHome({
  user,
  activeTrips,
  completedTrips,
  onViewTrips,
  onSelectTrip,
  onPassport,
  onCalendar,
}: {
  user: { name: string };
  activeTrips: TransportRequest[];
  completedTrips: TransportRequest[];
  onViewTrips: () => void;
  onSelectTrip: (t: TransportRequest) => void;
  onPassport: () => void;
  onCalendar: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-navy-950">
        <p className="text-sm opacity-80">Welcome back,</p>
        <h2 className="text-xl font-bold">{user.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <ClipboardCheck className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{activeTrips.length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Active Trips</p>
        </Card>
        <Card className="p-4 text-center">
          <Car className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{completedTrips.length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Completed</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPassport}
          className={`${th.bgCard} border ${th.border} rounded-xl p-4 text-left hover:border-amber-500/50 transition-colors`}
        >
          <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400 mb-2" />
          <p className={`text-sm font-medium ${th.text}`}>My Passport</p>
          <p className={`text-xs ${th.textMuted}`}>View certification & QR</p>
        </button>
        <button
          onClick={onCalendar}
          className={`${th.bgCard} border ${th.border} rounded-xl p-4 text-left hover:border-amber-500/50 transition-colors`}
        >
          <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-2" />
          <p className={`text-sm font-medium ${th.text}`}>Calendar</p>
          <p className={`text-xs ${th.textMuted}`}>View trip schedule</p>
        </button>
      </div>

      {activeTrips.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium ${th.textSecondary} mb-2`}>Active Trips</h3>
          <div className="space-y-2">
            {activeTrips.slice(0, 3).map((t) => (
              <Card key={t.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onSelectTrip(t)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-medium ${th.text}`}>{t.passengerName}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {t.pickup}
                      <ArrowRight className="w-3 h-3" />
                      {t.destination}
                    </div>
                  </div>
                  <Badge status={t.status}>{t.status.replace(/_/g, " ")}</Badge>
                </div>
              </Card>
            ))}
          </div>
          <button onClick={onViewTrips} className="text-amber-500 dark:text-amber-400 text-sm mt-2 hover:underline">
            View All →
          </button>
        </div>
      )}
    </div>
  );
}
