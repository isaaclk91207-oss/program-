import { useState, useEffect } from "react";
import { Button, Input, Select, SearchInput, th, EmptyState, Icon, DataTable, TableRow, TableCell, useToast } from "../ui";
import { getPassengers, createDriver, createPassenger, apiErrorMessage } from "../../services/api";
import { DEPARTMENTS } from "../passenger/CreateRequestForm";
import type { Driver } from "../../types";

interface PassengerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
}

interface AccountRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "Driver" | "Passenger";
  department: string;
}

export default function AccountsPage({
  drivers,
  onRefresh,
}: {
  drivers: Driver[];
  onRefresh: () => void | Promise<void>;
}) {
  const { addToast } = useToast();
  const [passengers, setPassengers] = useState<PassengerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function loadPassengers() {
    try {
      const data: PassengerRow[] = await getPassengers();
      setPassengers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPassengers(); }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (role === "PASSENGER" && !department) errs.department = "Department is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (role === "DRIVER") {
        await createDriver({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
        await onRefresh();
      } else {
        await createPassenger({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined, department });
        await loadPassengers();
      }
      addToast("success", `${role === "DRIVER" ? "Driver" : "Passenger"} account created for ${name.trim()}`);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setDepartment("");
      setErrors({});
    } catch (err) {
      addToast("error", apiErrorMessage(err, "Failed to create account"));
    } finally {
      setSubmitting(false);
    }
  };

  const rows: AccountRow[] = [
    ...drivers.map((d) => ({ id: d.id, name: d.name, email: d.email, phone: d.phone, role: "Driver" as const, department: "" })),
    ...passengers.map((p) => ({ id: p.id, name: p.name, email: p.email, phone: p.phone, role: "Passenger" as const, department: p.department })),
  ].filter((r) => {
    const q = search.toLowerCase();
    return q === "" || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Accounts</h2>
          <span className={`text-sm ${th.textMuted}`}>({drivers.length + passengers.length} total · {drivers.length} drivers · {passengers.length} passengers)</span>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search accounts..." className="w-full sm:w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${th.bgCard} border ${th.border} rounded-xl p-5 h-fit`}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="person_add" size={20} className="text-emerald-500" />
            <h3 className="font-semibold">Create Account</h3>
          </div>

          <div className={`flex gap-1 p-1 rounded-lg border ${th.border} mb-5`}>
            {(["PASSENGER", "DRIVER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setErrors({}); }}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${role === r ? "bg-emerald-500 text-white" : `${th.textSecondary} hover:${th.text}`}`}
              >
                {r === "PASSENGER" ? "Passenger" : "Driver"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aye Chan Ko"
              error={errors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              error={errors.email}
              required
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+95 9 123 456 789"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              error={errors.password}
              required
            />
            {role === "PASSENGER" && (
              <Select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                error={errors.department}
                options={[{ value: "", label: "Select department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
              />
            )}
            <Button type="submit" accent="admin" className="w-full" disabled={submitting}>
              <Icon name="person_add" size={16} />
              {submitting ? "Creating..." : `Create ${role === "DRIVER" ? "Driver" : "Passenger"} Account`}
            </Button>
          </form>
        </div>

        <div className={`lg:col-span-2 ${th.bgCard} border ${th.border} rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">All Accounts</h3>
            <span className={`text-sm ${th.textMuted}`}>({rows.length})</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : rows.length === 0 ? (
            <EmptyState message="No accounts found" />
          ) : (
            <DataTable headers={["Name", "Email", "Phone", "Role", "Department"]}>
              {rows.map((r) => (
                <TableRow key={`${r.role}-${r.id}`}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${r.role === "Driver" ? "bg-sky-500/10 text-sky-600 border-sky-500/30" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"}`}>
                      {r.role}
                    </span>
                  </TableCell>
                  <TableCell>{r.department || "—"}</TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  );
}
