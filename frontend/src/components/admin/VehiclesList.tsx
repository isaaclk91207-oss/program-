import { useState } from "react";
import { Card, Button, Badge, SearchInput, th, ConfirmDialog, Icon } from "../ui";
import VehicleDetail from "./VehicleDetail";
import VehicleForm from "./VehicleForm";
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
          <Button variant="secondary" size="sm" onClick={onExport}><Icon name="download" size={16} className="mr-1" />Export</Button>
          <Button size="sm" accent="admin" onClick={() => setShowForm(true)}><Icon name="add" size={16} className="mr-1" />Add</Button>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => setSelectedVehicle(v)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Icon name="local_shipping" size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className={`text-sm font-medium font-mono ${th.text}`}>{v.plate}</p>
                  <p className={`text-xs ${th.textMuted}`}>{v.make} {v.model} · {v.year} · {v.color}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {v.assignedDriverName && (
                  <div className="flex items-center gap-1">
                    <Icon name="person" size={12} className="text-slate-400" />
                    <span className={`text-xs ${th.textMuted}`}>{v.assignedDriverName}</span>
                  </div>
                )}
                <Icon name="qr_code" size={16} className="text-slate-400" />
                <Badge status={v.status}>{v.status}</Badge>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }} className="text-slate-400 hover:text-rose-500 p-1">
                  <Icon name="delete" size={16} />
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
