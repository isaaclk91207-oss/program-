import { useState, useMemo } from "react";
import { Card, Button, Badge, EmptyState, SearchInput, th, Icon, DataTable, TableRow, TableCell } from "../ui";
import { exportExcel, exportCSV, downloadBlob } from "../../services/api";
import AssignModal from "./AssignModal";
import BatchAssignModal from "./BatchAssignModal";
import CheckInOutModal from "./CheckInOutModal";
import type { TransportRequest, Driver, Vehicle } from "../../types";
import { formatRequestId } from "../../types";
import { getStatusLabel } from "../../lib/status";

// Statuses where the admin may check a driver in (mirrors backend rules)
const CHECK_IN_STATUSES = ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED"];

function canCheckIn(r: TransportRequest) {
  return !!r.driverId && !!r.vehiclePlate && CHECK_IN_STATUSES.includes(r.status) && !r.hasActiveCheckin;
}

function canCheckOut(r: TransportRequest) {
  return !!r.driverId && !!r.vehiclePlate && !!r.hasActiveCheckin;
}

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
  onAssignBatch,
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
  onAssignBatch: (requestIds: string[], data: { driverId: string; vehicleId: string }) => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [inlineAssign, setInlineAssign] = useState<Record<string, { driverId: string; vehicleId: string }>>({});
  const [exporting, setExporting] = useState(false);
  const [checkAction, setCheckAction] = useState<{ request: TransportRequest; mode: "in" | "out" } | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Group by destination state
  const [groupByDest, setGroupByDest] = useState(false);
  const [destFilter, setDestFilter] = useState("");

  // Get unique destinations from pending requests for the filter dropdown
  const uniqueDestinations = useMemo(() => {
    const dests = new Set(
      requests
        .filter((r) => r.status === "PENDING")
        .map((r) => r.destination)
    );
    return [...dests].sort();
  }, [requests]);

  // Build a set of request IDs that share the same destination+date as the hovered/selected one
  const highlightedIds = useMemo(() => {
    if (!groupByDest) return new Set<string>();
    const destMap = new Map<string, Set<string>>();
    for (const r of requests) {
      if (r.status !== "PENDING") continue;
      const key = `${r.destination}|||${r.date}`;
      if (!destMap.has(key)) destMap.set(key, new Set());
      destMap.get(key)!.add(r.id);
    }
    // All IDs that have at least one match (group of 2+)
    const highlighted = new Set<string>();
    for (const ids of destMap.values()) {
      if (ids.size >= 2) {
        for (const id of ids) highlighted.add(id);
      }
    }
    return highlighted;
  }, [requests, groupByDest]);

  const filtered = requests
    .filter((r) => filter === "ALL" || r.status === filter)
    .filter((r) => {
      if (destFilter && r.status === "PENDING") {
        return r.destination === destFilter;
      }
      return true;
    })
    .filter((r) =>
      search === "" ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.requestNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      r.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.department || "").toLowerCase().includes(search.toLowerCase()) ||
      r.pickup.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase())
    );

  // Pending requests that can be selected for batch
  const selectablePending = filtered.filter((r) => r.status === "PENDING");
  const allPendingSelected = selectablePending.length > 0 && selectablePending.every((r) => selectedIds.has(r.id));

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

  async function handleExport(format: "excel" | "csv") {
    setExporting(true);
    try {
      const blob = format === "excel" ? await exportExcel("requests") : await exportCSV("requests");
      const filename = `requests_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const r of selectablePending) next.delete(r.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const r of selectablePending) next.add(r.id);
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const selectedPendingRequests = requests.filter((r) => selectedIds.has(r.id) && r.status === "PENDING");

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
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
            <Icon name="table_chart" size={16} className="mr-1" />
            {exporting ? "Exporting..." : "Excel"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
            <Icon name="description" size={16} className="mr-1" />
            {exporting ? "Exporting..." : "CSV"}
          </Button>
        </div>
      </div>

      {/* Status filter pills */}
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

      {/* Group by destination + destination filter */}
      {filter === "ALL" || filter === "PENDING" ? (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => { setGroupByDest(!groupByDest); setDestFilter(""); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              groupByDest
                ? "bg-role-admin/10 text-role-admin border-role-admin/30"
                : `${th.bgInput} ${th.textSecondary} border-transparent hover:${th.text}`
            }`}
          >
            <Icon name="group_work" size={14} />
            {groupByDest ? "Grouped by Destination" : "Group by Destination"}
          </button>
          {groupByDest && (
            <select
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${th.border} ${th.bgInput} ${th.text}`}
            >
              <option value="">All destinations (highlighting matches)</option>
              {uniqueDestinations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
      ) : null}

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
              <p className={th.textSecondary}>Department</p>
              <p className={th.text}>{selectedRequest.department || "-"}</p>
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

          {/* Check-In / Check-Out actions (visible once a driver is assigned) */}
          {(canCheckIn(selectedRequest) || canCheckOut(selectedRequest)) && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2.5">
                  <Icon name="fact_check" size={22} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface dark:text-white">Driver Check-In / Check-Out</p>
                    <p className="text-xs text-on-surface-variant dark:text-outline-variant mt-0.5">
                      Required after assignment — starts and ends the driver's driving hours for this trip.
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedRequest.hasActiveCheckin
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedRequest.hasActiveCheckin ? "bg-white" : "bg-amber-500"}`} />
                  {selectedRequest.hasActiveCheckin ? "Checked In" : "Not Checked In"}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  accent="admin"
                  size="sm"
                  disabled={!canCheckIn(selectedRequest)}
                  onClick={() => setCheckAction({ request: selectedRequest, mode: "in" })}
                >
                  <Icon name="login" size={15} className="mr-1.5" />
                  Check In
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canCheckOut(selectedRequest)}
                  className="border-amber-400 text-amber-600 dark:text-amber-400 dark:border-amber-500/50"
                  onClick={() => setCheckAction({ request: selectedRequest, mode: "out" })}
                >
                  <Icon name="logout" size={15} className="mr-1.5" />
                  Check Out
                </Button>
              </div>
              {!canCheckIn(selectedRequest) && !selectedRequest.hasActiveCheckin && (
                <p className="text-xs text-on-surface-variant dark:text-outline-variant mt-2">
                  Check-in becomes available for ASSIGNED / QR pending / pickup-scanned trips.
                </p>
              )}
            </div>
          )}

          {selectedRequest.status === "PENDING" && (
            <Button accent="admin" onClick={() => onShowAssignModal(true)} className="mt-4">Assign Driver + Vehicle</Button>
          )}
        </Card>
      ) : (
        <>
          {filtered.length === 0 ? (
            <EmptyState message="No requests found" />
          ) : (
            <>
              {/* Batch action bar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-3 mb-3 rounded-xl bg-role-admin/5 border border-role-admin/20">
                  <span className="text-sm font-medium">
                    <span className="text-role-admin font-bold">{selectedIds.size}</span> request{selectedIds.size > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      accent="admin"
                      size="sm"
                      onClick={() => setShowBatchModal(true)}
                    >
                      <Icon name="group_add" size={14} className="mr-1" />
                      Assign Selected
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <Icon name="close" size={14} />
                    </Button>
                  </div>
                </div>
              )}

              <DataTable
                headers={["", "Request ID", "Passenger", "Dept", "Pickup", "Destination", "Departs", "Driver", "Vehicle", "Status", ""]}
              >
                {filtered.map((r) => {
                  const isPending = r.status === "PENDING";
                  const isSelectable = isPending;
                  const isSelected = selectedIds.has(r.id);
                  const isHighlighted = highlightedIds.has(r.id);
                  const sel = inlineAssign[r.id] || { driverId: "", vehicleId: "" };
                  const version = r.version;
                  const activeDrivers = getDriversForVersion(version);
                  const activeVehicles = getVehiclesForVersion(version);

                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => !isPending && onSelectRequest(r)}
                    >
                      {/* Checkbox column */}
                      <TableCell className="w-10">
                        {isSelectable ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatRequestId(r.id, r.requestNumber)}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.passengerName || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.department || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.pickup}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isHighlighted && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                          {r.destination}
                        </div>
                      </TableCell>
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
                      <TableCell className="text-right whitespace-nowrap">
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
                        ) : canCheckOut(r) || canCheckIn(r) ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {canCheckIn(r) && (
                              <Button
                                accent="admin"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCheckAction({ request: r, mode: "in" });
                                }}
                              >
                                <Icon name="login" size={14} className="mr-1" />
                                Check In
                              </Button>
                            )}
                            {canCheckOut(r) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="border-amber-400 text-amber-600 dark:text-amber-400 dark:border-amber-500/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCheckAction({ request: r, mode: "out" });
                                }}
                              >
                                <Icon name="logout" size={14} className="mr-1" />
                                Check Out
                              </Button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); onSelectRequest(r); }} className="p-1 text-on-surface-variant">
                              <Icon name="chevron_right" size={18} />
                            </button>
                          </div>
                        ) : (
                          <Icon name="chevron_right" size={18} className="text-on-surface-variant inline" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </DataTable>
            </>
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

      {showBatchModal && selectedPendingRequests.length > 0 && (
        <BatchAssignModal
          requests={selectedPendingRequests}
          drivers={drivers}
          vehicles={vehicles}
          onAssignBatch={(ids, data) => {
            onAssignBatch(ids, data);
            setShowBatchModal(false);
            clearSelection();
          }}
          onClose={() => setShowBatchModal(false)}
        />
      )}

      {checkAction && (
        <CheckInOutModal
          request={checkAction.request}
          mode={checkAction.mode}
          onClose={() => setCheckAction(null)}
          onDone={onRefresh}
        />
      )}
    </div>
  );
}
