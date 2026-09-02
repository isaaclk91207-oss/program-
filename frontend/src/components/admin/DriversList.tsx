import { useState } from "react";
import { Card, Button, Badge, CertBadge, SearchInput, th, ConfirmDialog } from "../ui";
import DriverDetail from "./DriverDetail";
import DriverForm from "./DriverForm";
import type { Driver } from "../../types";
import { ArrowLeft, Plus, Star, Download, Trash2 } from "lucide-react";

export default function DriversList({
  drivers, selectedDriver, onSelectDriver, onUpdateAssessment, onRefresh, onExport,
  onAddDriver, onDeleteDriver, onUpdateDriver,
}: {
  drivers: Driver[];
  selectedDriver: Driver | null;
  onSelectDriver: (d: Driver | null) => void;
  onUpdateAssessment: (driverId: string, data: { written: number; practical: Record<string, number>; operational: Record<string, number> }) => void;
  onRefresh: () => void;
  onExport: () => void;
  onAddDriver: (data: { email: string; password: string; name: string; phone?: string }) => void;
  onDeleteDriver: (id: string) => void;
  onUpdateDriver: (id: string, data: Record<string, unknown>) => void;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const filtered = drivers.filter(
    (d) => search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedDriver) {
    return (
      <DriverDetail
        driver={selectedDriver}
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
          <Button variant="secondary" size="sm" onClick={onExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((d) => (
          <Card key={d.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onSelectDriver(d)}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-sm font-medium ${th.text}`}>{d.name} <span className={`${th.textMuted} font-mono`}>{d.id}</span></p>
                <p className={`text-xs ${th.textMuted}`}>Score: {d.score} · <Star className="w-3 h-3 inline text-amber-400 fill-amber-400" />{d.rating} · {d.currentVehiclePlate || "No vehicle"}</p>
              </div>
              <div className="flex items-center gap-2">
                <CertBadge level={d.certLevel} />
                <Badge status={d.certStatus}>{d.certStatus}</Badge>
                <Badge status={d.status}>{d.status}</Badge>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} className="text-slate-400 hover:text-rose-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
