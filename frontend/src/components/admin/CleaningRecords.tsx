import { Card, Button, DataTable, TableRow, TableCell, EmptyState, HoursCard, KPICard, Icon, th } from "../ui";
import type { TripHoursEntry } from "../../types";

export default function CleaningRecords({
  drivingHours,
  vehiclePlate,
  onRecord,
}: {
  drivingHours: { cleaningHours: number; trips: TripHoursEntry[] } | null;
  vehiclePlate: string;
  onRecord: (requestId: string | null) => void;
}) {
  const trips = drivingHours?.trips || [];
  const records = trips.filter((t) => (t.redZoneCleaningMs || 0) > 0);
  const totalHours = drivingHours?.cleaningHours || 0;
  const canRecord = trips.length > 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Cleaning Records</h3>
            <p className={`text-xs ${th.textMuted}`}>Manual vehicle cleaning time logged per completed trip</p>
          </div>
          <div className="flex items-center gap-2">
            {!canRecord && drivingHours && (
              <span className={`text-xs ${th.textMuted}`}>
                No completed trip — cleaning requires a finished trip (QR drop-off)
              </span>
            )}
            <Button
              size="sm"
              accent="admin"
              disabled={!canRecord}
              title={canRecord ? "Record cleaning time" : "No completed trip available for this driver"}
              onClick={() => onRecord(null)}
            >
              <Icon name="cleaning_services" size={16} className="mr-1" />
              Record Cleaning
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <HoursCard type="cleaning" value={drivingHours ? `${totalHours}h` : "—"} showDescription={false} />
          </div>
          <div className="w-40">
            <KPICard label="Records" value={records.length} icon={<Icon name="cleaning_services" size={20} />} color="emerald" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Records</h3>
        {!drivingHours ? (
          <EmptyState message="Loading cleaning records..." icon={<Icon name="hourglass_top" size={40} className="mb-3" />} />
        ) : !canRecord ? (
          <EmptyState
            message="No completed trips yet — cleaning can only be recorded after a trip is completed (QR drop-off)"
            icon={<Icon name="directions_car" size={40} className="mb-3" />}
          />
        ) : records.length === 0 ? (
          <EmptyState message="No cleaning records yet" icon={<Icon name="cleaning_services" size={40} className="mb-3" />} />
        ) : (
          <DataTable headers={["Date", "Duration", "Vehicle", "Description", "Actions"]}>
            {records.map((t) => {
              const hours = Math.round((t.redZoneCleaningMs / 3600000) * 10) / 10;
              const minutes = Math.round(t.redZoneCleaningMs / 60000);
              return (
                <TableRow key={t.requestId}>
                  <TableCell className="whitespace-nowrap">{t.tripDate || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-medium text-emerald-500">{hours}h</span>
                    <span className={`ml-1 text-xs ${th.textMuted}`}>({minutes}m)</span>
                  </TableCell>
                  <TableCell className="font-mono">{vehiclePlate || "—"}</TableCell>
                  <TableCell>{t.route || t.requestId}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => onRecord(t.requestId)} className="h-7 px-2 text-xs">
                      <Icon name="edit" size={12} className="mr-0.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        )}
      </Card>
    </div>
  );
}
