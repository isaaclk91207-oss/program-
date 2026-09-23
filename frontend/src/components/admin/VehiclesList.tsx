import { useState } from "react";
import { Card, Button, Badge, SearchInput, th, ConfirmDialog, Icon, DataTable, TableRow, TableCell } from "../ui";
import { exportExcel, exportCSV, downloadBlob } from "../../services/api";
import VehicleDetail from "./VehicleDetail";
import VehicleForm from "./VehicleForm";
import type { Vehicle } from "../../types";

export default function VehiclesList({
  vehicles, onRefresh, onAddVehicle, onDeleteVehicle,
}: {
  vehicles: Vehicle[];
  onRefresh: () => void;
  onAddVehicle: (data: { plate: string; make: string; model: string; year: number; color: string }) => void;
  onDeleteVehicle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = vehicles.filter(
    (v) => search === "" || v.plate.toLowerCase().includes(search.toLowerCase()) || v.make.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase())
  );

  async function handleExport(format: "excel" | "csv") {
    setExporting(true);
    try {
      const blob = format === "excel" ? await exportExcel("vehicles") : await exportCSV("vehicles");
      const filename = `vehicles_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  if (selectedVehicle) {
    return <VehicleDetail vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Vehicles</h2>
          <span className={`text-sm ${th.textMuted}`}>({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search vehicles..." className="w-full sm:w-64" />
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
              <Icon name="table_chart" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "Excel"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
              <Icon name="description" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "CSV"}
            </Button>
            <Button size="sm" accent="admin" onClick={() => setShowForm(true)}><Icon name="add" size={16} className="mr-1" />Add</Button>
          </div>
        </div>
      </div>
      <DataTable headers={["Plate", "Make", "Model", "Year", "Color", "Status", "Assigned Driver", "QR", "Actions"]}>
        {filtered.map((v) => (
          <TableRow key={v.id} onClick={() => setSelectedVehicle(v)}>
            <TableCell className="font-mono font-medium">{v.plate}</TableCell>
            <TableCell>{v.make}</TableCell>
            <TableCell>{v.model}</TableCell>
            <TableCell className="text-center">{v.year}</TableCell>
            <TableCell>{v.color}</TableCell>
            <TableCell><Badge status={v.status}>{v.status}</Badge></TableCell>
            <TableCell>{v.assignedDriverName || "—"}</TableCell>
            <TableCell className="text-center"><Icon name="qr_code" size={16} className="text-slate-400" /></TableCell>
            <TableCell>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }} className="text-slate-400 hover:text-rose-500 p-1">
                <Icon name="delete" size={16} />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <VehicleForm open={showForm} onClose={() => setShowForm(false)} onSubmit={(data) => { onAddVehicle(data); setShowForm(false); }} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDeleteVehicle(deleteTarget.id); setDeleteTarget(null); } }}
        title="Delete Vehicle"
        message={`Permanently delete vehicle ${deleteTarget?.plate}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
