import { Card, Button, DataTable, TableRow, TableCell, EmptyState, HoursCard, KPICard, Icon, th } from "../ui";
import type { CleaningRecord } from "../../types";

export default function CleaningRecords({
  records,
  vehiclePlate,
  onRecord,
  onEdit,
}: {
  records: CleaningRecord[] | null;
  vehiclePlate: string;
  onRecord: () => void;
  onEdit: (record: CleaningRecord) => void;
}) {
  const list = records || [];
  const totalMs = list.reduce((s, r) => s + (r.cleaningTimeMs || 0), 0);
  const totalHours = Math.round((totalMs / 3600000) * 10) / 10;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Cleaning Records</h3>
            <p className={`text-xs ${th.textMuted}`}>
              External cleaning log — not linked to any trip or check-in
            </p>
          </div>
          <Button
            size="sm"
            accent="admin"
            title="Record cleaning time"
            onClick={onRecord}
          >
            <Icon name="cleaning_services" size={16} className="mr-1" />
            Record Cleaning
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <HoursCard type="cleaning" value={records ? `${totalHours}h` : "—"} showDescription={false} />
          </div>
          <div className="w-40">
            <KPICard label="Records" value={records ? list.length : "—"} icon={<Icon name="cleaning_services" size={20} />} color="emerald" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Records</h3>
        {!records ? (
          <EmptyState message="Loading cleaning records..." icon={<Icon name="hourglass_top" size={40} className="mb-3" />} />
        ) : list.length === 0 ? (
          <EmptyState message="No cleaning records yet" icon={<Icon name="cleaning_services" size={40} className="mb-3" />} />
        ) : (
          <DataTable headers={["Date", "Duration", "Vehicle", "Description", "Actions"]}>
            {list.map((r) => {
              const hours = Math.round((r.cleaningTimeMs / 3600000) * 10) / 10;
              const minutes = Math.round(r.cleaningTimeMs / 60000);
              const date = r.tripDate || (r.recordedAt ? new Date(r.recordedAt).toLocaleDateString() : "—");
              const description = r.remark || r.route || "External cleaning";
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{date}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-medium text-emerald-500">{hours}h</span>
                    <span className={`ml-1 text-xs ${th.textMuted}`}>({minutes}m)</span>
                  </TableCell>
                  <TableCell className="font-mono">{r.vehiclePlate || vehiclePlate || "—"}</TableCell>
                  <TableCell>{description}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => onEdit(r)} className="h-7 px-2 text-xs">
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
