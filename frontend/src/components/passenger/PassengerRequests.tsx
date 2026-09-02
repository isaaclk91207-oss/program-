import { Card, Badge, EmptyState, th } from "../ui";
import StatusStepper from "./StatusStepper";
import { ArrowLeft, MapPin, ArrowRight, Calendar, Clock, Car, User, QrCode, MessageSquare } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function PassengerRequests({
  requests,
  onSelect,
  onBack,
  selectedRequest,
  onPickupScan,
  onDropoffScan,
  onFeedback,
}: {
  requests: TransportRequest[];
  onSelect: (r: TransportRequest) => void;
  onBack: () => void;
  selectedRequest: TransportRequest | null;
  onPickupScan: (id: string) => void;
  onDropoffScan: (id: string) => void;
  onFeedback: (r: TransportRequest) => void;
}) {
  if (selectedRequest) {
    return (
      <div>
        <button onClick={() => onSelect(null as unknown as TransportRequest)} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <StatusStepper currentStatus={selectedRequest.status} />

        <Card className="p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold">{selectedRequest.id}</h3>
            <Badge status={selectedRequest.status}>{selectedRequest.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Pickup</span>
                <span className={th.text}>{selectedRequest.pickup}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Destination</span>
                <span className={th.text}>{selectedRequest.destination}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Date</span>
                <span className={th.text}>{selectedRequest.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Time</span>
                <span className={th.text}>{selectedRequest.time}</span>
              </div>
            </div>
            {selectedRequest.driverName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <div className="flex-1 flex justify-between">
                  <span className={th.textSecondary}>Driver</span>
                  <span className={th.text}>{selectedRequest.driverName}</span>
                </div>
              </div>
            )}
            {selectedRequest.vehiclePlate && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <div className="flex-1 flex justify-between">
                  <span className={th.textSecondary}>Vehicle</span>
                  <span className={`${th.text} font-mono`}>{selectedRequest.vehiclePlate}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-2">
          {(selectedRequest.status === "QR_PENDING" || selectedRequest.status === "ASSIGNED") && (
            <button onClick={() => onPickupScan(selectedRequest.id)} className="w-full bg-amber-500 hover:bg-amber-600 text-navy-950 font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4" />
              Scan QR (Pickup)
            </button>
          )}
          {(selectedRequest.status === "PICK_UP_SCANNED" || selectedRequest.status === "IN_PROGRESS") && (
            <button onClick={() => onDropoffScan(selectedRequest.id)} className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4" />
              Scan QR (Dropoff)
            </button>
          )}
          {selectedRequest.status === "DROP_OFF_SCANNED" && (
            <button onClick={() => onFeedback(selectedRequest)} className="w-full bg-amber-500 hover:bg-amber-600 text-navy-950 font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Submit Feedback
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Transport Requests</h2>
      {requests.length === 0 ? (
        <EmptyState message="No transport requests yet" />
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onSelect(r)}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${th.text}`}>{r.id}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {r.pickup}
                    <ArrowRight className="w-3 h-3" />
                    {r.destination}
                  </div>
                  <p className={`text-xs ${th.textMuted} mt-1`}>{r.date} · {r.time}</p>
                </div>
                <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
