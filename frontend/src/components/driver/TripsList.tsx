import { Card, Badge, EmptyState, th } from "../ui";
import TripDetail from "./TripDetail";
import { ArrowLeft, MapPin, ArrowRight, Calendar } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function TripsList({
  trips,
  selectedTrip,
  onSelectTrip,
  onCheckIn,
  onCheckOut,
  onBack,
}: {
  trips: TransportRequest[];
  selectedTrip: TransportRequest | null;
  onSelectTrip: (t: TransportRequest | null) => void;
  onCheckIn: (vehiclePlate: string, location: string, remark?: string) => void;
  onCheckOut: (vehiclePlate: string, location: string, remark?: string) => void;
  onBack: () => void;
}) {
  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => onSelectTrip(null)} onCheckIn={onCheckIn} onCheckOut={onCheckOut} />;
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-lg font-semibold mb-4">My Trips</h2>
      {trips.length === 0 ? (
        <EmptyState message="No trips assigned" />
      ) : (
        <div className="space-y-2">
          {trips.map((t) => (
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
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {t.date} · {t.time}
                  </div>
                </div>
                <Badge status={t.status}>{t.status.replace(/_/g, " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
