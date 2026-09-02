import { useState, useEffect } from "react";
import { Card, Badge, SearchInput, th, EmptyState } from "../ui";
import { getPassengers } from "../../services/api";
import { User, Mail, Building, ClipboardList, CheckCircle } from "lucide-react";

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
        <SearchInput value={search} onChange={setSearch} placeholder="Search passengers..." className="w-full sm:w-64" />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No passengers found" />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${th.text}`}>{p.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" />{p.department}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <p className={`font-bold ${th.text}`}>{p.totalRequests}</p>
                    <p className={th.textMuted}>Requests</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-emerald-500">{p.completedRequests}</p>
                    <p className={th.textMuted}>Completed</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
