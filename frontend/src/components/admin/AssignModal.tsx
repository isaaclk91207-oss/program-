import { useState } from "react";
import { Button, Modal, Select, th, Icon } from "../ui";
import type { Driver, Vehicle } from "../../types";

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

export default function AssignModal({
  requestId,
  requestVersion,
  drivers,
  vehicles,
  onAssign,
  onAssignGrab,
  onClose,
}: {
  requestId: string;
  requestVersion?: "v1" | "v2";
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssign: (requestId: string, data: { driverId: string; vehicleId: string }) => void;
  onAssignGrab?: (requestId: string) => void;
  onClose: () => void;
}) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const activeDrivers = drivers
    .filter((d) => d.status === "Active" || d.status === "AVAILABLE")
    .filter((d) => !requestVersion || (d.version ?? "v1") === requestVersion);
  const activeVehicles = vehicles
    .filter((v) => v.status === "ACTIVE")
    .filter((v) => !requestVersion || (v.version ?? "v1") === requestVersion);

  const noFleet = activeDrivers.length === 0 || activeVehicles.length === 0;
  const canGrab = requestVersion !== "v2" && !!onAssignGrab;
  const showGrabPrimary = noFleet && canGrab;

  return (
    <Modal open title="Assign Driver + Vehicle" onClose={onClose}>
      <div className="space-y-4">
        {noFleet && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 text-sm text-amber-800 dark:text-amber-300">
            <Icon name="directions_car" size={18} className="mt-0.5 shrink-0" />
            <span>
              {canGrab
                ? "No drivers or vehicles available — assign this request to Grab (ride-hailing) instead."
                : "No drivers or vehicles available for this request."}
            </span>
          </div>
        )}
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
        <Select
          label="Vehicle"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          options={[
            { value: "", label: "Select vehicle" },
            ...activeVehicles.map((v) => ({
              value: v.id,
              label: v.version === "v2"
                ? v.plate
                : `${v.plate} · ${v.make} ${v.model}`,
            })),
          ]}
        />
        <div className="flex gap-3 pt-2">
          {showGrabPrimary ? (
            <Button
              accent="admin"
              onClick={() => onAssignGrab!(requestId)}
              className="flex-1"
            >
              <Icon name="local_taxi" size={18} className="mr-2" />
              Assign to Grab
            </Button>
          ) : (
            <Button
              accent="admin"
              onClick={() => onAssign(requestId, { driverId: selectedDriver, vehicleId: selectedVehicle })}
              disabled={!selectedDriver || !selectedVehicle}
              className="flex-1"
            >
              Confirm Assignment
            </Button>
          )}
          {canGrab && !showGrabPrimary && (
            <Button
              variant="secondary"
              className="border-emerald-400 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/50"
              onClick={() => onAssignGrab!(requestId)}
            >
              <Icon name="local_taxi" size={18} className="mr-2" />
              Assign to Grab
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
