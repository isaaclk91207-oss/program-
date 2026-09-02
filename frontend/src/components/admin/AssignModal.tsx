import { useState } from "react";
import { Button, Modal, Select, th } from "../ui";
import { Star } from "lucide-react";
import type { Driver, Vehicle } from "../../types";

export default function AssignModal({
  requestId,
  drivers,
  vehicles,
  onAssign,
  onClose,
}: {
  requestId: string;
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssign: (requestId: string, data: { driverId: string; vehicleId: string }) => void;
  onClose: () => void;
}) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const activeDrivers = drivers.filter((d) => d.status === "Active");
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE");

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
              label: `${d.name} (${d.id}) · ${d.certLevel} · ⭐${d.rating}`,
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
              label: `${v.plate} · ${v.make} ${v.model}`,
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
