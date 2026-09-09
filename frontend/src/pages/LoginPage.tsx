import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button, Icon } from "../components/ui";

const DEMO_ACCOUNTS = [
  { role: "ADMIN" as const, email: "admin@pccp.demo", password: "admin123", label: "Admin", icon: "admin_panel_settings" as const },
  { role: "DRIVER" as const, email: "drv017@pccp.demo", password: "driver123", label: "Driver", icon: "local_shipping" as const },
  { role: "PASSENGER" as const, email: "thin.thin@company.com", password: "passenger123", label: "Passenger", icon: "person" as const },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"admin" | "passenger" | "driver">("passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTabLogin = async (role: "admin" | "passenger" | "driver") => {
    const account = DEMO_ACCOUNTS.find((a) => a.role.toLowerCase() === role);
    if (!account) return;
    setLoading(true);
    setError("");
    setEmail(account.email);
    setPassword(account.password);
    try {
      const user = await login(account.email, account.password);
      navigate(`/${user.role.toLowerCase()}`);
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      navigate(`/${user.role.toLowerCase()}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const tabRoleColors: Record<string, string> = {
    admin: "bg-emerald-600 hover:bg-emerald-700 text-white",
    passenger: "bg-blue-600 hover:bg-blue-700 text-white",
    driver: "bg-purple-600 hover:bg-purple-700 text-white",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #00507d 0%, #00796B 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/pccp-logo.png" alt="PCCP Logo" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">PCCP</h1>
          <p className="text-white/80 text-sm">Professional Chauffeur Certification Program</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Role tabs */}
          <div className="flex">
            {(["admin", "passenger", "driver"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                className={`flex-1 py-3 px-2 text-sm font-semibold capitalize flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === role
                    ? `${tabRoleColors[role]}`
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon name={DEMO_ACCOUNTS.find((a) => a.role.toLowerCase() === role)!.icon} size={18} fill={activeTab === role} />
                {role}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="px-8 py-10">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Sign In</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              {activeTab === "admin" && "Admin Portal — System Management"}
              {activeTab === "passenger" && "Passenger Portal — Ride & Booking"}
              {activeTab === "driver" && "Driver Portal — Trips & Assessments"}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" loading={loading} className="w-full" accent="system">
                Sign In
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-slate-400">
              By signing in, you agree to the platform's Terms and Privacy Policy.
            </div>
          </div>

          {/* Quick demo buttons (hidden per plan) */}
          <div className="hidden">
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.role} onClick={() => handleTabLogin(account.role.toLowerCase() as "admin" | "passenger" | "driver")}>
                {account.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-white/60 text-xs">
            Questions? Contact your system administrator.
          </p>
          <p className="text-white/40 text-xs">
            PCCP &copy; {new Date().getFullYear()} — Professional Chauffeur Certification Platform
          </p>
        </div>
      </div>
    </div>
  );
}
