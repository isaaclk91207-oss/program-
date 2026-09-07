import { useState } from "react";
import { Button, Modal, Select, th } from "../ui";
import { Star } from "lucide-react";
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
  onClose,
}: {
  requestId: string;
  requestVersion?: "v1" | "v2";
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssign: (requestId: string, data: { driverId: string; vehicleId: string }) => void;
  onClose: () => void;
}) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const activeDrivers = drivers
    .filter((d) => d.status === "Active" || d.status === "AVAILABLE")
    .filter((d) => !requestVersion || d.version === requestVersion);
  const activeVehicles = vehicles
    .filter((v) => v.status === "ACTIVE")
    .filter((v) => !requestVersion || v.version === requestVersion);

  return (
    <Modal open title="Assign Driver + Vehicle" onClose={onClose}>
      <div className="space-y-4">
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
          <Button
            onClick={() => onAssign(requestId, { driverId: selectedDriver, vehicleId: selectedVehicle })}
            disabled={!selectedDriver || !selectedVehicle}
            className="flex-1"
          >
            Confirm Assignment
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
