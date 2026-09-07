import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button, Card } from "../components/ui";
import { Shield, Car, User, Mail, Lock, LogIn } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "ADMIN" as const, email: "admin@pccp.demo", password: "admin123", label: "Admin", icon: Shield },
  { role: "DRIVER" as const, email: "thura.koko@pccp.demo", password: "driver123", label: "Driver (Thura Ko Ko)", icon: Car },
  { role: "PASSENGER" as const, email: "thin.thin@company.com", password: "passenger123", label: "Passenger (Daw Thin Thin)", icon: User },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    setError("");
    try {
      const user = await login(account.email, account.password);
      navigate(`/${user.role.toLowerCase()}`);
    } catch {
      setError("Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-navy-950">P</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">PCCP</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Professional Chauffeur Certification Program</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            {error && <p className="text-rose-500 text-sm">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <p className="text-center text-xs text-slate-400 uppercase tracking-wider">Quick Demo Login</p>
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            return (
              <button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                disabled={loading}
                className="w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg p-3 flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{account.label}</p>
                  <p className="text-xs text-slate-500">{account.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
