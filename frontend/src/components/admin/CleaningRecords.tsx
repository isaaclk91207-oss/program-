import { Card, HoursCard, Button, Icon, DataTable, TableRow, TableCell, EmptyState, th } from "../ui";
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
  const records = (drivingHours?.trips || []).filter((t) => (t.redZoneCleaningMs || 0) > 0);
  const totalHours = drivingHours?.cleaningHours || 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <HoursCard type="cleaning" value={drivingHours ? `${totalHours}h` : "—"} showDescription={false} />
            <div>
              <p className={`text-xs ${th.textSecondary} uppercase tracking-wider`}>Records</p>
              <p className={`text-2xl font-bold ${th.text}`}>{records.length}</p>
            </div>
          </div>
          <Button accent="admin" onClick={() => onRecord(null)} disabled={!drivingHours?.trips.length}>
            <Icon name="cleaning_services" size={16} className="mr-1" />
            Record Cleaning
          </Button>
        </div>
      </Card>

      {records.length > 0 ? (
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
                  <Button size="sm" variant="secondary" onClick={() => onRecord(t.requestId)} className="h-6 px-2 text-xs">
                    <Icon name="edit" size={12} className="mr-0.5" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      ) : (
        <Card className="p-4">
          <EmptyState message={drivingHours ? "No cleaning records yet" : "Loading cleaning records…"} icon={<Icon name="cleaning_services" size={40} className="mb-3" />} />
        </Card>
      )}
    </div>
  );
}
