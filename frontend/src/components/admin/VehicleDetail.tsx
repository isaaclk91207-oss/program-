import { Card, Badge, th, Icon } from "../ui";
import { QRCodeSVG } from "qrcode.react";
import type { Vehicle } from "../../types";

export default function VehicleDetail({
  vehicle,
  onBack,
}: {
  vehicle: Vehicle;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-role-admin dark:text-emerald-400 text-sm mb-3">
        <Icon name="arrow_back" size={16} /> Back to vehicles
      </button>

      <Card className="p-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold font-mono">{vehicle.plate}</h3>
            <p className={`text-sm ${th.textSecondary}`}>{vehicle.make} {vehicle.model} · {vehicle.year}</p>
          </div>
          <Badge status={vehicle.status}>{vehicle.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Icon name="directions_car" size={16} className="text-slate-400" />
            <div>
              <p className={th.textSecondary}>Make / Model</p>
              <p className={th.text}>{vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" size={16} className="text-slate-400" />
            <div>
              <p className={th.textSecondary}>Year</p>
              <p className={th.text}>{vehicle.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="palette" size={16} className="text-slate-400" />
            <div>
              <p className={th.textSecondary}>Color</p>
              <p className={th.text}>{vehicle.color}</p>
            </div>
          </div>
          {vehicle.assignedDriverName && (
            <div className="flex items-center gap-2">
              <Icon name="person" size={16} className="text-slate-400" />
              <div>
                <p className={th.textSecondary}>Assigned Driver</p>
                <p className={th.text}>{vehicle.assignedDriverName}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="qr_code" size={20} className="text-role-admin dark:text-emerald-400" />
          <h3 className="font-semibold">Vehicle QR Code</h3>
        </div>
        <p className={`text-xs ${th.textMuted} mb-4`}>
          This QR code is permanent and unique to this vehicle. Passengers scan it to verify pickup/dropoff.
        </p>
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={vehicle.qrValue} size={180} level="M" />
          </div>
          <p className={`text-sm font-mono mt-3 ${th.textSecondary}`}>{vehicle.qrValue}</p>
        </div>
      </Card>
    </div>
  );
}
