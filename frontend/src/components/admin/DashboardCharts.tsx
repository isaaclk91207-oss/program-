import { Card, th } from "../ui";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardStats } from "../../types";
import { getStatusLabel } from "../../lib/status";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  ASSIGNED: "#3b82f6",
  QR_PENDING: "#a855f7",
  PICK_UP_SCANNED: "#06b6d4",
  IN_PROGRESS: "#6366f1",
  DROP_OFF_SCANNED: "#14b8a6",
  FEEDBACK_SUBMITTED: "#10b981",
};

const DEPT_COLORS = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#ef4444", "#06b6d4", "#f97316"];

export default function DashboardCharts({ data }: { data: DashboardStats }) {
  const statusData = data.requestsByStatus.map((s) => ({
    name: getStatusLabel(s.status as any, "admin"),
    value: s.count,
    color: STATUS_COLORS[s.status] || "#64748b",
  }));

  const deptData = data.requestsByDepartment.map((d, i) => ({
    name: d.department,
    count: d.count,
    fill: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {statusData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Requests by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text)",
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {deptData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Requests by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text)",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {deptData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
