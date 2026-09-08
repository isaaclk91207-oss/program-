import { useState } from "react";
import { Card, Button, Badge, EmptyState, SearchInput, th, Icon, DataTable, TableRow, TableCell } from "../ui";
import AssignModal from "./AssignModal";
import type { TransportRequest, Driver, Vehicle } from "../../types";
import { formatRequestId } from "../../types";

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
      (r.requestNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      r.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {selectedRequest && (
            <button onClick={() => onSelectRequest(null)} className="text-role-admin dark:text-emerald-400">
              <Icon name="arrow_back" size={20} />
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
                ? "bg-emerald-600 text-white"
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
            <h3 className="font-semibold">{formatRequestId(selectedRequest.id, selectedRequest.requestNumber)}</h3>
            <Badge status={selectedRequest.status}>{selectedRequest.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Icon name="person" size={16} />
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
              <Icon name="location_on" size={16} />
              <div>
                <p className={th.textSecondary}>Pickup</p>
                <p className={th.text}>{selectedRequest.pickup}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="location_on" size={16} />
              <div>
                <p className={th.textSecondary}>Destination</p>
                <p className={th.text}>{selectedRequest.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="calendar_today" size={16} />
              <div>
                <p className={th.textSecondary}>Date</p>
                <p className={th.text}>{selectedRequest.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="schedule" size={16} />
              <div>
                <p className={th.textSecondary}>Time</p>
                <p className={th.text}>{selectedRequest.time}</p>
              </div>
            </div>
            {selectedRequest.driverName && (
              <div className="flex items-center gap-2">
                <Icon name="directions_car" size={16} />
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
            <Button accent="admin" onClick={() => onShowAssignModal(true)} className="mt-4">Assign Driver + Vehicle</Button>
          )}
        </Card>
      ) : (
        <>
          {filtered.length === 0 ? (
            <EmptyState message="No requests found" />
          ) : (
            <DataTable
              headers={["Request ID", "Passenger", "Dept", "Pickup", "Destination", "Departs", "Driver", "Vehicle", "Status", ""]}
            >
              {filtered.map((r) => (
                <TableRow key={r.id} onClick={() => onSelectRequest(r)}>
                  <TableCell className="font-medium whitespace-nowrap">{formatRequestId(r.id, r.requestNumber)}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.passengerName || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.department || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.pickup}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.destination}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted">{r.date} · {r.time}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.driverName || <span className={th.textMuted}>Unassigned</span>}</TableCell>
                  <TableCell className="font-mono whitespace-nowrap">{r.vehiclePlate || <span className={th.textMuted}>—</span>}</TableCell>
                  <TableCell><Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}
          {requests.length > 0 && (
            <div className="flex justify-end mt-3">
              <Button variant="ghost" onClick={onRefresh} size="sm">
                <Icon name="refresh" size={16} className="mr-1" /> Refresh
              </Button>
            </div>
          )}
        </>
      )}

      {showAssignModal && selectedRequest && (
        <AssignModal
          requestId={selectedRequest.id}
          requestVersion={selectedRequest.version}
          drivers={drivers}
          vehicles={vehicles}
          onAssign={onAssign}
          onClose={() => onShowAssignModal(false)}
        />
      )}
    </div>
  );
}
