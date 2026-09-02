import { useState } from "react";
import { Card, Button, Badge, SearchInput, th, ConfirmDialog } from "../ui";
import VehicleDetail from "./VehicleDetail";
import VehicleForm from "./VehicleForm";
import { Download, Truck, User, Plus, QrCode, Trash2 } from "lucide-react";
import type { Vehicle } from "../../types";

export default function VehiclesList({
  vehicles, onRefresh, onExport, onAddVehicle, onDeleteVehicle,
}: {
  vehicles: Vehicle[];
  onRefresh: () => void;
  onExport: () => void;
  onAddVehicle: (data: { plate: string; make: string; model: string; year: number; color: string }) => void;
  onDeleteVehicle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const filtered = vehicles.filter(
    (v) => search === "" || v.plate.toLowerCase().includes(search.toLowerCase()) || v.make.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase())
  );

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
          <Button variant="secondary" size="sm" onClick={onExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => setSelectedVehicle(v)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className={`text-sm font-medium font-mono ${th.text}`}>{v.plate}</p>
                  <p className={`text-xs ${th.textMuted}`}>{v.make} {v.model} · {v.year} · {v.color}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {v.assignedDriverName && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className={`text-xs ${th.textMuted}`}>{v.assignedDriverName}</span>
                  </div>
                )}
                <QrCode className="w-4 h-4 text-slate-400" />
                <Badge status={v.status}>{v.status}</Badge>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }} className="text-slate-400 hover:text-rose-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
