import { useState } from "react";
import { Card, Button, Badge, EmptyState, SearchInput, th, Icon, DataTable, TableRow, TableCell } from "../ui";
import AssignModal from "./AssignModal";
import type { TransportRequest, Driver, Vehicle } from "../../types";
import { formatRequestId } from "../../types";
import { getStatusLabel } from "../../lib/status";

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

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
  const [inlineAssign, setInlineAssign] = useState<Record<string, { driverId: string; vehicleId: string }>>({});

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

  function getDriversForVersion(version?: "v1" | "v2") {
    return drivers
      .filter((d) => d.status === "Active" || d.status === "AVAILABLE")
      .filter((d) => !version || (d.version ?? "v1") === version);
  }

  function getVehiclesForVersion(version?: "v1" | "v2") {
    return vehicles
      .filter((v) => v.status === "ACTIVE")
      .filter((v) => !version || (v.version ?? "v1") === version);
  }

  function handleInlineAssign(requestId: string) {
    const sel = inlineAssign[requestId];
    if (!sel || !sel.driverId || !sel.vehicleId) return;
    onAssign(requestId, { driverId: sel.driverId, vehicleId: sel.vehicleId });
    setInlineAssign((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  }

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
            <Badge status={selectedRequest.status}>{getStatusLabel(selectedRequest.status as any, "admin")}</Badge>
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
              <p className={th.textSecondary}>No. of People</p>
              <p className={th.text}>{selectedRequest.noOfPeople || 1}</p>
            </div>
            {selectedRequest.wayUsers && (
              <div className="col-span-2">
                <p className={th.textSecondary}>Way Users</p>
                <p className={th.text}>{selectedRequest.wayUsers}</p>
              </div>
            )}
            {selectedRequest.section && (
              <div>
                <p className={th.textSecondary}>Section</p>
                <p className={th.text}>{selectedRequest.section}</p>
              </div>
            )}
            {selectedRequest.serviceType && (
              <div>
                <p className={th.textSecondary}>Service Type</p>
                <p className={th.text}>{selectedRequest.serviceType}</p>
              </div>
            )}
            {selectedRequest.purpose && (
              <div className="col-span-2">
                <p className={th.textSecondary}>Purpose</p>
                <p className={th.text}>{selectedRequest.purpose}</p>
              </div>
            )}
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
                <p className={th.textSecondary}>Departure Time</p>
                <p className={th.text}>{selectedRequest.time}</p>
              </div>
            </div>
            {selectedRequest.returnTime && (
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={16} />
                <div>
                  <p className={th.textSecondary}>Return Time</p>
                  <p className={th.text}>{selectedRequest.returnTime}</p>
                </div>
              </div>
            )}
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
            {selectedRequest.note && (
              <div className="col-span-2">
                <p className={th.textSecondary}>Note to Transport</p>
                <p className={th.text}>{selectedRequest.note}</p>
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
              {filtered.map((r) => {
                const isPending = r.status === "PENDING";
                const sel = inlineAssign[r.id] || { driverId: "", vehicleId: "" };
                const version = r.version;
                const activeDrivers = getDriversForVersion(version);
                const activeVehicles = getVehiclesForVersion(version);

                return (
                  <TableRow key={r.id} onClick={() => !isPending && onSelectRequest(r)}>
                    <TableCell className="font-medium whitespace-nowrap">{formatRequestId(r.id, r.requestNumber)}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.passengerName || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.department || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.pickup}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.destination}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted">{r.date} · {r.time}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isPending ? (
                        <select
                          value={sel.driverId}
                          onChange={(e) => {
                            e.stopPropagation();
                            setInlineAssign((prev) => ({ ...prev, [r.id]: { ...prev[r.id], driverId: e.target.value, vehicleId: prev[r.id]?.vehicleId || "" } }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded border bg-surface-container-low dark:bg-navy-900 border-border-hairline dark:border-outline-variant ${th.text} focus:outline-none focus:border-role-admin`}
                        >
                          <option value="">Select driver</option>
                          {activeDrivers.map((d) => (
                            <option key={d.id} value={d.id}>{d.name} ({getDisplayId(d)})</option>
                          ))}
                        </select>
                      ) : (
                        r.driverName || <span className={th.textMuted}>Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono whitespace-nowrap">
                      {isPending ? (
                        <select
                          value={sel.vehicleId}
                          onChange={(e) => {
                            e.stopPropagation();
                            setInlineAssign((prev) => ({ ...prev, [r.id]: { driverId: prev[r.id]?.driverId || "", vehicleId: e.target.value } }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs px-2 py-1 rounded border bg-surface-container-low dark:bg-navy-900 border-border-hairline dark:border-outline-variant ${th.text} focus:outline-none focus:border-role-admin`}
                        >
                          <option value="">Select vehicle</option>
                          {activeVehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.version === "v2" ? v.plate : `${v.plate} · ${v.make}`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        r.vehiclePlate || <span className={th.textMuted}>—</span>
                      )}
                    </TableCell>
                    <TableCell><Badge status={r.status}>{getStatusLabel(r.status as any, "admin")}</Badge></TableCell>
                    <TableCell className="text-right">
                      {isPending ? (
                        <Button
                          accent="admin"
                          size="sm"
                          disabled={!sel.driverId || !sel.vehicleId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInlineAssign(r.id);
                          }}
                        >
                          Assign
                        </Button>
                      ) : (
                        <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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
