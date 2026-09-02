import { useState } from "react";
import { Card, Button, Badge, EmptyState, SearchInput, th } from "../ui";
import AssignModal from "./AssignModal";
import type { TransportRequest, Driver, Vehicle } from "../../types";
import { ArrowLeft, MapPin, Calendar, Clock, Car, User } from "lucide-react";

export default function RequestsList({
  requests,
  drivers,
  vehicles,
  selectedRequest,
  onSelectRequest,
  showAssignModal,
  onShowAssignModal,
  onAssign,
  onRefresh,
}: {
  requests: TransportRequest[];
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedRequest: TransportRequest | null;
  onSelectRequest: (r: TransportRequest | null) => void;
  showAssignModal: boolean;
  onShowAssignModal: (v: boolean) => void;
  onAssign: (requestId: string, data: { driverId: string; vehicleId: string }) => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const filtered = requests
    .filter((r) => filter === "ALL" || r.status === filter)
    .filter((r) =>
      search === "" ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {selectedRequest && (
            <button onClick={() => onSelectRequest(null)} className="text-amber-500 dark:text-amber-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-2xl font-bold">Transport Requests</h2>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." className="w-full sm:w-64" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["ALL", "PENDING", "ASSIGNED", "QR_PENDING", "IN_PROGRESS", "DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? "bg-amber-500 text-navy-950"
                : `${th.bgInput} ${th.textSecondary} hover:${th.text}`
            }`}
          >
            {s === "ALL" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {selectedRequest ? (
        <Card className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold">{selectedRequest.id}</h3>
            <Badge status={selectedRequest.status}>{selectedRequest.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <p className={th.textSecondary}>Passenger</p>
                <p className={th.text}>{selectedRequest.passengerName}</p>
              </div>
            </div>
            <div>
              <p className={th.textSecondary}>Department</p>
              <p className={th.text}>{selectedRequest.department}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <p className={th.textSecondary}>Pickup</p>
                <p className={th.text}>{selectedRequest.pickup}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div>
                <p className={th.textSecondary}>Destination</p>
                <p className={th.text}>{selectedRequest.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className={th.textSecondary}>Date</p>
                <p className={th.text}>{selectedRequest.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className={th.textSecondary}>Time</p>
                <p className={th.text}>{selectedRequest.time}</p>
              </div>
            </div>
            {selectedRequest.driverName && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <div>
                  <p className={th.textSecondary}>Driver</p>
                  <p className={th.text}>{selectedRequest.driverName}</p>
                </div>
              </div>
            )}
            {selectedRequest.vehiclePlate && (
              <div>
                <p className={th.textSecondary}>Vehicle</p>
                <p className={`${th.text} font-mono`}>{selectedRequest.vehiclePlate}</p>
              </div>
            )}
          </div>
          {selectedRequest.status === "PENDING" && (
            <Button onClick={() => onShowAssignModal(true)} className="mt-4">Assign Driver + Vehicle</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState message="No requests found" />
          ) : (
            filtered.map((r) => (
              <Card key={r.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onSelectRequest(r)}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-medium ${th.text}`}>{r.id} · {r.passengerName}</p>
                    <p className={`text-xs ${th.textMuted}`}>{r.pickup} → {r.destination} · {r.date}</p>
                  </div>
                  <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {showAssignModal && selectedRequest && (
        <AssignModal
          requestId={selectedRequest.id}
          drivers={drivers}
          vehicles={vehicles}
          onAssign={onAssign}
          onClose={() => onShowAssignModal(false)}
        />
      )}
    </div>
  );
}
