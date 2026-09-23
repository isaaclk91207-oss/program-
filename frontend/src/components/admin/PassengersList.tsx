import { useState, useEffect } from "react";
import { Button, SearchInput, th, EmptyState, Icon, DataTable, TableRow, TableCell } from "../ui";
import { exportExcel, exportCSV, downloadBlob } from "../../services/api";
import { getPassengers } from "../../services/api";

interface PassengerRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  totalRequests: number;
  completedRequests: number;
}

export default function PassengersList() {
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadPassengers(); }, []);

  async function loadPassengers() {
    setLoading(true);
    try {
      const data = await getPassengers();
      setPassengers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "excel" | "csv") {
    setExporting(true);
    try {
      const blob = format === "excel" ? await exportExcel("passengers") : await exportCSV("passengers");
      const filename = `passengers_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  const filtered = passengers.filter(
    (p) => search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()) || p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Passengers</h2>
          <span className={`text-sm ${th.textMuted}`}>({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search passengers..." className="w-full sm:w-64" />
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
              <Icon name="table_chart" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "Excel"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
              <Icon name="description" size={16} className="mr-1" />
              {exporting ? "Exporting..." : "CSV"}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No passengers found" />
      ) : (
        <DataTable headers={["Name", "Email", "Phone", "Department", "Total Requests", "Completed"]}>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>{p.phone || "—"}</TableCell>
              <TableCell>{p.department}</TableCell>
              <TableCell className="text-center">{p.totalRequests}</TableCell>
              <TableCell className="text-center text-emerald-500 font-bold">{p.completedRequests}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
