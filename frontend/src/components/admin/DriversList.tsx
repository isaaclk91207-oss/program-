import { useState } from "react";
import { Card, Button, Badge, CertBadge, SearchInput, th, ConfirmDialog, Icon, DataTable, TableRow, TableCell } from "../ui";
import { exportExcel, exportCSV, downloadBlob } from "../../services/api";
import DriverDetail from "./DriverDetail";
import DriverForm from "./DriverForm";
import type { Driver, Vehicle } from "../../types";

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

function formatPhone(phone: string | null) {
  return phone || "—";
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    Active: "ACTIVE",
    Suspended: "SUSPENDED",
    Inactive: "RETIRED",
  };
  return colors[status] || "PENDING";
}

export default function DriversList({
  drivers, vehicles, selectedDriver, onSelectDriver, onUpdateAssessment, onRefresh,
  onAddDriver, onDeleteDriver, onUpdateDriver,
}: {
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedDriver: Driver | null;
  onSelectDriver: (d: Driver | null) => void;
  onUpdateAssessment: (driverId: string, data: { written: number; practical: Record<string, number>; operational: Record<string, number> }) => void;
  onRefresh: () => void;
  onAddDriver: (data: { email: string; password: string; name: string; phone?: string }) => void;
  onDeleteDriver: (id: string) => void;
  onUpdateDriver: (id: string, data: Record<string, unknown>) => void;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = drivers.filter(
    (d) => search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async (format: "excel" | "csv") => {
    setExporting(true);
    try {
      const blob = format === "excel" ? await exportExcel("drivers") : await exportCSV("drivers");
      const filename = `drivers_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (selectedDriver) {
    return (
      <DriverDetail
        driver={selectedDriver}
        vehicles={vehicles}
        onBack={() => onSelectDriver(null)}
        onUpdateAssessment={(data) => onUpdateAssessment(selectedDriver.id, data)}
        onUpdateDriver={(data) => onUpdateDriver(selectedDriver.id, data)}
        onDeleteDriver={() => { onDeleteDriver(selectedDriver.id); onSelectDriver(null); }}
        onIssueCert={(level, validUntil) => { onUpdateDriver(selectedDriver.id, { certStatus: "CERTIFIED", certLevel: level, validUntil }); onSelectDriver(null); }}
        onRevokeCert={(reason) => { onUpdateDriver(selectedDriver.id, { certStatus: "REVOKED" }); onSelectDriver(null); }}
        onSuspendDriver={(reason) => { onUpdateDriver(selectedDriver.id, { status: "Suspended" }); onSelectDriver(null); }}
        onUnsuspendDriver={() => { onUpdateDriver(selectedDriver.id, { status: "Active" }); onSelectDriver(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Drivers</h2>
          <span className={`text-sm ${th.textMuted}`}>({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search drivers..." className="w-full sm:w-64" />
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
              <Icon name="table_chart" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "Excel"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
              <Icon name="description" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "CSV"}
            </Button>
            <Button accent="admin" size="sm" onClick={() => setShowForm(true)}><Icon name="add" size={16} />Add</Button>
          </div>
        </div>
      </div>
      <DataTable headers={["Name", "ID", "Email", "Phone", "Cert Level", "Cert Status", "Valid Until", "Vehicle", "Score", "Rating", "Status", "Actions"]}>
        {filtered.map((d) => (
          <TableRow key={d.id} onClick={() => onSelectDriver(d)}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="font-mono">{getDisplayId(d)}</TableCell>
            <TableCell>{d.email}</TableCell>
            <TableCell>{formatPhone(d.phone)}</TableCell>
            <TableCell><CertBadge level={d.certLevel} /></TableCell>
            <TableCell><Badge status={d.certStatus}>{d.certStatus}</Badge></TableCell>
            <TableCell>{d.validUntil ? d.validUntil.split("T")[0] : "—"}</TableCell>
            <TableCell className="font-mono">{d.currentVehiclePlate || "—"}</TableCell>
            <TableCell className="text-right">{d.score}</TableCell>
            <TableCell className="text-right">{d.rating}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge status={getStatusBadge(d.status)}>{d.status}</Badge>
                {d.hasActiveCheckin && (
                  <span
                    title={d.activeCheckinVehiclePlate ? `Checked in — ${d.activeCheckinVehiclePlate}` : "Checked in"}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white whitespace-nowrap"
                  >
                    <span className="w-1 h-1 rounded-full bg-white" />
                    Checked In
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }}
                className="text-slate-400 hover:text-rose-500 p-1"
              >
                <Icon name="delete" size={16} />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <DriverForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(data) => { onAddDriver(data); setShowForm(false); }} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDeleteDriver(deleteTarget.id); setDeleteTarget(null); } }}
        title="Delete Driver"
        message={`Permanently delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
