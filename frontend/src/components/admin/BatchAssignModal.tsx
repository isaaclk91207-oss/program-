import { useState } from "react";
import { Button, Modal, Select, th, Icon } from "../ui";
import type { Driver, Vehicle, TransportRequest } from "../../types";
import { formatRequestId } from "../../types";

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

export default function BatchAssignModal({
  requests,
  drivers,
  vehicles,
  onAssignBatch,
  onClose,
}: {
  requests: TransportRequest[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssignBatch: (requestIds: string[], data: { driverId: string; vehicleId: string }) => void;
  onClose: () => void;
}) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  const versions = new Set(pendingRequests.map((r) => r.version ?? "v1"));
  const isMixedVersion = versions.size > 1;

  const activeDrivers = drivers
    .filter((d) => d.status === "Active" || d.status === "AVAILABLE")
    .filter((d) => isMixedVersion || (d.version ?? "v1") === [...versions][0]);

  const activeVehicles = vehicles
    .filter((v) => v.status === "ACTIVE")
    .filter((v) => isMixedVersion || (v.version ?? "v1") === [...versions][0]);

  const totalPassengers = pendingRequests.reduce((sum, r) => sum + (r.noOfPeople || 1), 0);

  function handleAssign() {
    if (!selectedDriver || !selectedVehicle) return;
    onAssignBatch(
      pendingRequests.map((r) => r.id),
      { driverId: selectedDriver, vehicleId: selectedVehicle }
    );
  }

  return (
    <Modal open title="Batch Assign Requests" onClose={onClose}>
      <div className="space-y-4">
        {/* Selected requests summary */}
        <div>
          <p className={`text-sm font-medium ${th.text} mb-2`}>
            {pendingRequests.length} request{pendingRequests.length > 1 ? "s" : ""} selected
            <span className={`ml-2 text-xs ${th.textSecondary}`}>({totalPassengers} passenger{totalPassengers > 1 ? "s" : ""} total)</span>
          </p>
          <div className={`max-h-40 overflow-y-auto rounded-lg border ${th.border} divide-y ${th.border}`}>
            {pendingRequests.map((r) => (
              <div key={r.id} className={`flex items-center justify-between px-3 py-2 text-xs ${th.bgInput}`}>
                <div className="flex items-center gap-2">
                  <Icon name="description" size={14} className={th.textMuted} />
                  <span className={`font-medium ${th.text}`}>{formatRequestId(r.id, r.requestNumber)}</span>
                  <span className={th.textSecondary}>{r.passengerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono ${th.textSecondary}`}>{r.destination}</span>
                  <span className={th.textMuted}>{r.date} · {r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver selection */}
        <Select
          label="Driver"
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          options={[
            { value: "", label: "Select driver" },
            ...activeDrivers.map((d) => ({
              value: d.id,
              label: `${d.name} (${getDisplayId(d)})`,
            })),
          ]}
        />

        {/* Vehicle selection */}
        <Select
          label="Vehicle"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          options={[
            { value: "", label: "Select vehicle" },
            ...activeVehicles.map((v) => ({
              value: v.id,
              label: v.version === "v2" ? v.plate : `${v.plate} · ${v.make} ${v.model}`,
            })),
          ]}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            accent="admin"
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedVehicle}
            className="flex-1"
          >
            Assign All {pendingRequests.length} Request{pendingRequests.length > 1 ? "s" : ""}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
