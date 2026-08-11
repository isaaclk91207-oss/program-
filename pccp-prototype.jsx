import React, { useState, useEffect, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Car, Shield, User, Users, LayoutDashboard, ClipboardList, MessageSquare,
  Settings, LogOut, Search, ChevronRight, ChevronLeft, QrCode, CheckCircle2,
  XCircle, AlertTriangle, Star, MapPin, Navigation, Award, BadgeCheck, Clock,
  RefreshCw, ArrowLeft, Menu, X, Phone, Mail, TrendingUp, ShieldCheck,
  ShieldAlert, ShieldClose, Plus, Eye, ChevronDown, Home as HomeIcon, CreditCard,
  Sparkles, FileCheck2, Ban, ScanLine, Loader2, Filter, SlidersHorizontal
} from "lucide-react";

/* =========================================================================
   DESIGN TOKENS (documented, not enforced — see inline usage)
   Base:      slate-950 / slate-900 / slate-50 (navy-charcoal professional)
   Accent:    amber-500/600 (certification gold — used sparingly)
   Success:   emerald-600   Warning: amber-600   Error: rose-600
   Display:   font-semibold tracking-tight (headers)
   Data/IDs:  font-mono (passport numbers, driver IDs — "official document" feel)
   ========================================================================= */

/* -------------------------------------------------------------------------
   MOCK DATA — structured as the future API is expected to shape it.
   Scoring model below mirrors CALCULATION_LOGIC_OVERVIEW.docx (CD formula)
   and is explicitly a Phase 1 placeholder — weights are configurable.
   ------------------------------------------------------------------------- */

const CERT_LEVELS = ["CD", "CC", "CPC", "CEC", "CMC"];

const PASS_MARKS = { CD: 75, CC: 80, CPC: 85, CEC: 88, CMC: 90 };

const DEFAULT_WEIGHTS = { written: 0.2, practical: 0.3, operational: 0.3, feedback: 0.2 };

function feedbackTo100(avgRating) {
  return Math.round(avgRating * 20 * 10) / 10;
}

function computeOverallScore(a, weights = DEFAULT_WEIGHTS) {
  const feedback100 = feedbackTo100(a.feedbackAvg);
  const score =
    a.written * weights.written +
    a.practical * weights.practical +
    a.operational * weights.operational +
    feedback100 * weights.feedback;
  return Math.round(score * 100) / 100;
}

const RAW_DRIVERS = [
  { id: "DRV-001", name: "John Smith", level: "CPC", certStatus: "Certified", status: "Active", validUntil: "31 Dec 2026", phone: "+95 9 214 6683", email: "john.smith@pccp.demo", vehicle: "Toyota Alphard · YGN-3312", joined: "12 Mar 2023",
    assessment: { written: 88, practical: 92, operational: 90, feedbackAvg: 4.9 } },
  { id: "DRV-002", name: "David Lee", level: "CPC", certStatus: "Certified", status: "Active", validUntil: "18 Nov 2026", phone: "+95 9 254 1120", email: "david.lee@pccp.demo", vehicle: "Toyota Vellfire · YGN-1187", joined: "02 Jun 2023",
    assessment: { written: 85, practical: 89, operational: 87, feedbackAvg: 4.8 } },
  { id: "DRV-003", name: "Michael Chen", level: "CC", certStatus: "Certified", status: "Active", validUntil: "05 Feb 2027", phone: "+95 9 442 9931", email: "michael.chen@pccp.demo", vehicle: "Honda Odyssey · YGN-4420", joined: "21 Sep 2023",
    assessment: { written: 80, practical: 84, operational: 82, feedbackAvg: 4.7 } },
  { id: "DRV-004", name: "Aung Kyaw", level: "CC", certStatus: "Certified", status: "Active", validUntil: "14 Jan 2027", phone: "+95 9 761 0021", email: "aung.kyaw@pccp.demo", vehicle: "Toyota Estima · YGN-2260", joined: "30 Jan 2024",
    assessment: { written: 78, practical: 81, operational: 83, feedbackAvg: 4.6 } },
  { id: "DRV-005", name: "Kaung Htet", level: "CD", certStatus: "Certified", status: "Active", validUntil: "09 Aug 2026", phone: "+95 9 555 2214", email: "kaung.htet@pccp.demo", vehicle: "Toyota Wish · YGN-9021", joined: "17 Apr 2024",
    assessment: { written: 76, practical: 78, operational: 80, feedbackAvg: 4.4 } },
  { id: "DRV-006", name: "Zin Min Latt", level: "CD", certStatus: "Pending", status: "Active", validUntil: "—", phone: "+95 9 887 4402", email: "zin.min@pccp.demo", vehicle: "Toyota Noah · YGN-6631", joined: "03 Jul 2024",
    assessment: { written: 70, practical: 74, operational: 72, feedbackAvg: 4.1 } },
  { id: "DRV-007", name: "Thura Aung", level: "CD", certStatus: "Pending", status: "Active", validUntil: "—", phone: "+95 9 320 7754", email: "thura.aung@pccp.demo", vehicle: "Honda Freed · YGN-7742", joined: "22 Aug 2024",
    assessment: { written: 65, practical: 68, operational: 70, feedbackAvg: 3.8 } },
  { id: "DRV-008", name: "Nay Lin Oo", level: "CC", certStatus: "Suspended", status: "Inactive", validUntil: "—", phone: "+95 9 611 0087", email: "nay.lin@pccp.demo", vehicle: "Toyota Alphard · YGN-5590", joined: "11 Nov 2023",
    assessment: { written: 74, practical: 70, operational: 68, feedbackAvg: 3.2 } },
  { id: "DRV-009", name: "Htet Wai Yan", level: "CPC", certStatus: "Revoked", status: "Inactive", validUntil: "—", phone: "+95 9 992 3345", email: "htet.wai@pccp.demo", vehicle: "Toyota Vellfire · YGN-0043", joined: "05 Dec 2022",
    assessment: { written: 60, practical: 58, operational: 55, feedbackAvg: 2.6 } },
  { id: "DRV-010", name: "Soe Moe Kyaw", level: "CD", certStatus: "Certified", status: "Active", validUntil: "27 Oct 2026", phone: "+95 9 470 8812", email: "soe.moe@pccp.demo", vehicle: "Toyota Wish · YGN-3387", joined: "14 Feb 2024",
    assessment: { written: 82, practical: 85, operational: 86, feedbackAvg: 4.7 } },
];

const initialDrivers = RAW_DRIVERS.map((d) => ({
  ...d,
  score: computeOverallScore(d.assessment),
  rating: d.assessment.feedbackAvg,
}));

const FEEDBACK_LOG = [
  { driverId: "DRV-001", passenger: "PAS-00118", rating: 5, comment: "Extremely punctual and courteous. Car was spotless.", date: "08 Aug 2026" },
  { driverId: "DRV-001", passenger: "PAS-00102", rating: 5, comment: "Smooth, safe driving — will request again.", date: "05 Aug 2026" },
  { driverId: "DRV-003", passenger: "PAS-00094", rating: 4, comment: "Good service, arrived a few minutes late.", date: "04 Aug 2026" },
  { driverId: "DRV-008", passenger: "PAS-00071", rating: 2, comment: "Vehicle cleanliness needs improvement.", date: "02 Aug 2026" },
  { driverId: "DRV-005", passenger: "PAS-00061", rating: 5, comment: "Very professional and friendly.", date: "01 Aug 2026" },
];

const DESTINATIONS = ["Yangon International Airport", "Downtown", "Junction City", "Sule", "Yangon Central Station"];

const RANK_WEIGHTING_NOTE =
  "Ranking below is sorted by rating for prototype purposes only. The final ranking algorithm has not been confirmed.";

/* -------------------------------------------------------------------------
   SHARED ATOMS
   ------------------------------------------------------------------------- */

function cx(...a) { return a.filter(Boolean).join(" "); }

function Badge({ tone = "slate", children, icon: Icon }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    navy: "bg-slate-800 text-slate-50 border-slate-700",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function certToneMap(status) {
  if (status === "Certified") return { tone: "emerald", icon: ShieldCheck };
  if (status === "Pending") return { tone: "amber", icon: ShieldAlert };
  if (status === "Suspended") return { tone: "amber", icon: ShieldAlert };
  if (status === "Revoked") return { tone: "rose", icon: ShieldClose };
  return { tone: "slate", icon: Shield };
}

function CertBadge({ status }) {
  const { tone, icon } = certToneMap(status);
  return <Badge tone={tone} icon={icon}>{status}</Badge>;
}

function StatusBadge({ status }) {
  return status === "Active"
    ? <Badge tone="emerald" icon={CheckCircle2}>Active</Badge>
    : <Badge tone="rose" icon={XCircle}>Inactive</Badge>;
}

function Avatar({ name, size = "h-10 w-10", tone = "bg-slate-800" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className={cx(size, tone, "rounded-full flex items-center justify-center text-slate-50 font-semibold shrink-0")}>
      {initials}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={cx("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>{children}</div>;
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    accent: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button
      className={cx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

function ProgressBar({ value, tone = "slate" }) {
  const tones = { slate: "bg-slate-800", emerald: "bg-emerald-600", amber: "bg-amber-600", rose: "bg-rose-600" };
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={cx("h-full rounded-full", tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function StarRating({ value, onChange, size = "h-7 w-7", readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cx(readOnly ? "cursor-default" : "cursor-pointer")}
        >
          <Star className={cx(size, (hover || value) >= n ? "fill-amber-500 text-amber-500" : "text-slate-300")} />
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title = "No data available", subtitle, icon: Icon = ClipboardList }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children, tone = "slate" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    success: { bg: "bg-emerald-600", icon: CheckCircle2 },
    error: { bg: "bg-rose-600", icon: XCircle },
    info: { bg: "bg-slate-900", icon: Sparkles },
  };
  const t = tones[toast.type] || tones.info;
  const Icon = t.icon;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] animate-[fadein_.2s]">
      <div className={cx(t.bg, "text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg flex items-center gap-2 text-sm font-medium")}>
        <Icon className="h-4 w-4" /> {toast.message}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{children}</p>;
}

function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 shrink-0">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-semibold text-slate-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ROOT APP
   ------------------------------------------------------------------------- */

export default function App() {
  const [role, setRole] = useState(null);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function notify(message, type = "success") {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function resetToRoleSelect() {
    setRole(null);
  }

  return (
    <div className="min-h-full w-full bg-slate-50 text-slate-900" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <Toast toast={toast} />
      {!role && <RoleSelect onSelect={setRole} />}
      {role === "admin" && <AdminApp drivers={drivers} setDrivers={setDrivers} notify={notify} onExit={resetToRoleSelect} />}
      {role === "driver" && <DriverApp drivers={drivers} notify={notify} onExit={resetToRoleSelect} />}
      {role === "passenger" && <PassengerApp drivers={drivers} notify={notify} onExit={resetToRoleSelect} />}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ROLE SELECTION
   ------------------------------------------------------------------------- */

function RoleSelect({ onSelect }) {
  const cards = [
    { key: "admin", title: "Admin", desc: "Manage drivers, assessments and certification.", icon: LayoutDashboard, tag: "Desktop-oriented" },
    { key: "driver", title: "Driver", desc: "View profile, certification and QR identity.", icon: CreditCard, tag: "Mobile-first" },
    { key: "passenger", title: "Passenger", desc: "Use the service and rate your chauffeur.", icon: Car, tag: "Mobile-first" },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-slate-950">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4">
            <Shield className="h-4 w-4" /> Phase 1 Prototype
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">Professional Chauffeur<br className="hidden sm:block" /> Certification Program</h1>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">Choose a demo role to preview its experience. This selector is for prototype demonstration only — not the production sign-in.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => onSelect(c.key)}
              className="text-left bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-800 group-hover:bg-amber-600 flex items-center justify-center mb-5 transition-colors">
                <c.icon className="h-5 w-5 text-slate-300 group-hover:text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">{c.title}</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{c.desc}</p>
              <div className="flex items-center justify-between mt-6">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{c.tag}</span>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-600 text-xs mt-10">Business rules for scoring, certification progression and ranking are placeholders pending confirmation.</p>
      </div>
    </div>
  );
}

function RoleSwitchFooter({ onExit, label }) {
  return (
    <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
      <LogOut className="h-4 w-4" /> {label}
    </button>
  );
}

/* =========================================================================
   ADMIN APPLICATION
   ========================================================================= */

function AdminApp({ drivers, setDrivers, notify, onExit }) {
  const [screen, setScreen] = useState("dashboard"); // dashboard | drivers | detail | feedback | settings
  const [selectedId, setSelectedId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedDriver = drivers.find((d) => d.id === selectedId);

  function updateDriver(id, patch) {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "drivers", label: "Drivers", icon: Users },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  function go(key) {
    setScreen(key);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className={cx(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col transition-transform",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center"><Shield className="h-4 w-4 text-white" /></div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">PCCP Admin</p>
            <p className="text-[11px] text-slate-500">Management Console</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-500" onClick={() => setMobileNavOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => go(n.key)}
              className={cx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                screen === n.key || (n.key === "drivers" && screen === "detail")
                  ? "bg-slate-800 text-white"
                  : "hover:bg-slate-900 text-slate-400"
              )}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 flex items-center gap-3">
          <Avatar name="Admin User" tone="bg-amber-700" size="h-9 w-9" />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin User</p>
            <p className="text-[11px] text-slate-500">Program Administrator</p>
          </div>
        </div>
        <div className="px-4 pb-4"><RoleSwitchFooter onExit={onExit} label="Exit demo role" /></div>
      </aside>
      {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setMobileNavOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="font-semibold text-sm">PCCP Admin</span>
          <div className="w-5" />
        </div>

        {screen === "dashboard" && (
          <AdminDashboard drivers={drivers} onGoDrivers={() => go("drivers")} onGoFeedback={() => go("feedback")}
            onOpenDriver={(id) => { setSelectedId(id); setScreen("detail"); }} />
        )}
        {screen === "drivers" && (
          <AdminDrivers drivers={drivers} onOpenDriver={(id) => { setSelectedId(id); setScreen("detail"); }} />
        )}
        {screen === "detail" && selectedDriver && (
          <AdminDriverDetail
            driver={selectedDriver}
            onBack={() => setScreen("drivers")}
            onUpdate={(patch) => updateDriver(selectedDriver.id, patch)}
            notify={notify}
          />
        )}
        {screen === "feedback" && <AdminFeedback drivers={drivers} onOpenDriver={(id) => { setSelectedId(id); setScreen("detail"); }} />}
        {screen === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, tone = "slate", suffix }) {
  const tones = { slate: "text-slate-900", emerald: "text-emerald-600", amber: "text-amber-600" };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{label}</SectionLabel>
        <Icon className="h-4 w-4 text-slate-300" />
      </div>
      <p className={cx("text-3xl font-semibold tracking-tight", tones[tone])}>{value}<span className="text-base font-medium text-slate-400 ml-1">{suffix}</span></p>
    </Card>
  );
}

function AdminDashboard({ drivers, onGoDrivers, onGoFeedback, onOpenDriver }) {
  const total = drivers.length;
  const certified = drivers.filter((d) => d.certStatus === "Certified").length;
  const pending = drivers.filter((d) => d.certStatus === "Pending").length;
  const avgRating = (drivers.reduce((s, d) => s + d.rating, 0) / total).toFixed(1);
  const recentFeedback = FEEDBACK_LOG.slice(0, 3);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of driver certification, assessments and service quality.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Drivers" value={total} icon={Users} />
        <KPICard label="Certified Drivers" value={certified} icon={ShieldCheck} tone="emerald" />
        <KPICard label="Pending Assessments" value={pending} icon={ClipboardList} tone="amber" />
        <KPICard label="Avg. Driver Rating" value={avgRating} suffix="★" icon={Star} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Driver Activity</h2>
            <button onClick={onGoDrivers} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
          <div className="divide-y divide-slate-100">
            {drivers.slice(0, 5).map((d) => (
              <button key={d.id} onClick={() => onOpenDriver(d.id)} className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2">
                <Avatar name={d.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{d.id} · Level {d.level}</p>
                </div>
                <CertBadge status={d.certStatus} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={onGoDrivers}><Plus className="h-4 w-4" /> Add Driver</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoDrivers}><Users className="h-4 w-4" /> Manage Drivers</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoDrivers}><ClipboardList className="h-4 w-4" /> Enter Assessment</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoFeedback}><MessageSquare className="h-4 w-4" /> Review Feedback</Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Feedback</h2>
          <button onClick={onGoFeedback} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="space-y-3">
          {recentFeedback.map((f, i) => {
            const d = drivers.find((x) => x.id === f.driverId);
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <Avatar name={d?.name || "?"} size="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{d?.name}</p>
                    <StarRating value={f.rating} readOnly size="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.comment}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function AdminDrivers({ drivers, onOpenDriver }) {
  const [query, setQuery] = useState("");
  const [certFilter, setCertFilter] = useState("All");
  const [sortKey, setSortKey] = useState("name");

  const filtered = useMemo(() => {
    let list = drivers.filter((d) =>
      (d.name.toLowerCase().includes(query.toLowerCase()) || d.id.toLowerCase().includes(query.toLowerCase())) &&
      (certFilter === "All" || d.certStatus === certFilter)
    );
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "rating") return b.rating - a.rating;
      if (sortKey === "score") return b.score - a.score;
      return 0;
    });
    return list;
  }, [drivers, query, certFilter, sortKey]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Driver Management</h1>
          <p className="text-slate-500 text-sm mt-1">Search, filter and manage driver records.</p>
        </div>
        <Button variant="accent"><Plus className="h-4 w-4" /> Add Driver</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or driver ID"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              {["All", "Certified", "Pending", "Suspended", "Revoked"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              <option value="name">Sort: Name</option>
              <option value="rating">Sort: Rating</option>
              <option value="score">Sort: Score</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No drivers found" subtitle="Try adjusting your search or filter." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Driver ID</th>
                  <th className="px-5 py-3 font-medium">Certification</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} size="h-8 w-8" />
                        <span className="font-medium text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500">{d.id}</td>
                    <td className="px-5 py-3"><CertBadge status={d.certStatus} /></td>
                    <td className="px-5 py-3 text-slate-700">Level {d.level}</td>
                    <td className="px-5 py-3 text-slate-700 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {d.rating.toFixed(1)}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => onOpenDriver(d.id)} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminDriverDetail({ driver, onBack, onUpdate, notify }) {
  const [tab, setTab] = useState("overview");
  const [confirmModal, setConfirmModal] = useState(null); // 'status' | 'issue' | 'revoke' | null
  const [issueLevel, setIssueLevel] = useState(driver.level);
  const [revokeReason, setRevokeReason] = useState("");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "info", label: "Driver Information" },
    { key: "passport", label: "Driver Passport" },
    { key: "assessment", label: "Assessment" },
    { key: "feedback", label: "Feedback" },
  ];

  const eligible = driver.score >= (PASS_MARKS[issueLevel] || 100);

  function handleToggleStatus() {
    const next = driver.status === "Active" ? "Inactive" : "Active";
    onUpdate({ status: next });
    notify(`Driver set to ${next}.`, "success");
    setConfirmModal(null);
  }

  function handleIssue() {
    if (!eligible) return;
    onUpdate({ certStatus: "Certified", level: issueLevel, validUntil: "31 Dec 2026" });
    notify("Certified successfully.", "success");
    setConfirmModal(null);
  }

  function handleRevoke() {
    onUpdate({ certStatus: "Revoked", validUntil: "—" });
    notify("Certification revoked.", "success");
    setConfirmModal(null);
    setRevokeReason("");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <TopBar title={driver.name} subtitle={`${driver.id} · Level ${driver.level}`} onBack={onBack}
        right={<div className="hidden sm:flex items-center gap-2"><CertBadge status={driver.certStatus} /><StatusBadge status={driver.status} /></div>} />

      <div className="p-6 space-y-5">
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={driver.name} size="h-16 w-16" tone="bg-slate-800" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-900">{driver.name}</h2>
              <CertBadge status={driver.certStatus} />
              <StatusBadge status={driver.status} />
            </div>
            <p className="text-sm text-slate-400 font-mono mt-1">{driver.id} · Level {driver.level} · {driver.rating.toFixed(1)} ★</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setConfirmModal("status")}>
              {driver.status === "Active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {driver.status === "Active" ? "Set Inactive" : "Set Active"}
            </Button>
            <Button variant="success" onClick={() => setConfirmModal("issue")}><FileCheck2 className="h-4 w-4" /> Issue Certificate</Button>
            <Button variant="danger" onClick={() => setConfirmModal("revoke")} disabled={driver.certStatus === "Revoked"}><Ban className="h-4 w-4" /> Revoke Certificate</Button>
          </div>
        </Card>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cx("px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px",
                tab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600")}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-5">
            <Card className="p-5 md:col-span-2 space-y-4">
              <SectionLabel>Overall Performance</SectionLabel>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-semibold text-slate-900">{driver.score}%</p>
                <p className="text-sm text-slate-400 mb-1">Pass mark for Level {driver.level}: {PASS_MARKS[driver.level]}%</p>
              </div>
              <ProgressBar value={driver.score} tone={driver.score >= PASS_MARKS[driver.level] ? "emerald" : "amber"} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  ["Written", driver.assessment.written],
                  ["Practical", driver.assessment.practical],
                  ["Operational", driver.assessment.operational],
                  ["Feedback (100-pt)", feedbackTo100(driver.assessment.feedbackAvg)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span className="font-medium text-slate-700">{val}</span></div>
                    <ProgressBar value={val} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 space-y-3">
              <SectionLabel>Certification Timeline</SectionLabel>
              <TimelineRow icon={Clock} label="Joined program" value={driver.joined} />
              <TimelineRow icon={ShieldCheck} label="Current status" value={driver.certStatus} />
              <TimelineRow icon={Award} label="Valid until" value={driver.validUntil} />
            </Card>
          </div>
        )}

        {tab === "info" && (
          <Card className="p-5 grid sm:grid-cols-2 gap-5">
            <InfoRow icon={CreditCard} label="Driver ID" value={driver.id} mono />
            <InfoRow icon={Phone} label="Phone" value={driver.phone} />
            <InfoRow icon={Mail} label="Email" value={driver.email} />
            <InfoRow icon={Car} label="Assigned Vehicle" value={driver.vehicle} />
            <InfoRow icon={Clock} label="Joined" value={driver.joined} />
            <InfoRow icon={Shield} label="Account Status" value={driver.status} />
          </Card>
        )}

        {tab === "passport" && (
          <div className="max-w-sm">
            <PassportCard driver={driver} />
          </div>
        )}

        {tab === "assessment" && <AdminAssessmentPanel driver={driver} onUpdate={onUpdate} notify={notify} />}

        {tab === "feedback" && (
          <Card className="p-5">
            <SectionLabel>Feedback for {driver.name}</SectionLabel>
            <FeedbackList driverId={driver.id} />
          </Card>
        )}
      </div>

      {/* Status confirm */}
      <Modal open={confirmModal === "status"} onClose={() => setConfirmModal(null)} title={driver.status === "Active" ? "Set driver inactive?" : "Set driver active?"}>
        <p className="text-sm text-slate-600 mb-5">
          {driver.status === "Active"
            ? "The driver will be hidden from passenger search, ranking, and service matching. Their profile remains stored for records."
            : "The driver will become visible again in passenger search, ranking, and service matching."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          <Button variant={driver.status === "Active" ? "danger" : "success"} onClick={handleToggleStatus}>Confirm</Button>
        </div>
      </Modal>

      {/* Issue certificate */}
      <Modal open={confirmModal === "issue"} onClose={() => setConfirmModal(null)} title="Issue Certificate">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Certification Level</label>
            <select value={issueLevel} onChange={(e) => setIssueLevel(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {CERT_LEVELS.map((l) => <option key={l} value={l}>{l} — pass mark {PASS_MARKS[l]}%</option>)}
            </select>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">Current overall score</span>
            <span className="font-semibold text-slate-900">{driver.score}%</span>
          </div>
          {!eligible && (
            <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Driver does not meet the {PASS_MARKS[issueLevel]}% pass mark required for Level {issueLevel}. Issuance is blocked.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="success" disabled={!eligible} onClick={handleIssue}>Approve & Issue</Button>
          </div>
        </div>
      </Modal>

      {/* Revoke certificate */}
      <Modal open={confirmModal === "revoke"} onClose={() => setConfirmModal(null)} title="Revoke Certificate">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will immediately mark the driver's certification as Revoked. This action can be reviewed later but should be used deliberately.</p>
          <div>
            <label className="text-xs font-medium text-slate-500">Reason (optional)</label>
            <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3}
              placeholder="e.g. Repeated safety violations, red-zone breach"
              className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke}>Confirm Revoke</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TimelineRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-slate-500" /></div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-slate-500" /></div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={cx("text-sm font-medium text-slate-800", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

function AdminAssessmentPanel({ driver, onUpdate, notify }) {
  const [marks, setMarks] = useState({
    written: driver.assessment.written,
    practical: driver.assessment.practical,
    operational: driver.assessment.operational,
  });
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const feedback100 = feedbackTo100(driver.assessment.feedbackAvg);
  const overall = useMemo(() => {
    const a = { ...marks, feedbackAvg: driver.assessment.feedbackAvg };
    return computeOverallScore(a);
  }, [marks, driver.assessment.feedbackAvg]);

  function handleChange(key, raw) {
    setMarks((m) => ({ ...m, [key]: raw }));
  }

  function validate() {
    const errs = {};
    ["written", "practical", "operational"].forEach((key) => {
      const v = marks[key];
      if (v === "" || v === null || v === undefined) errs[key] = "Mark is required.";
      else if (isNaN(Number(v))) errs[key] = "Mark must be a number.";
      else if (Number(v) < 0 || Number(v) > 100) errs[key] = "Mark must be between 0 and 100.";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveClick() {
    if (!validate()) return;
    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    const numeric = { written: Number(marks.written), practical: Number(marks.practical), operational: Number(marks.operational) };
    const newAssessment = { ...driver.assessment, ...numeric };
    onUpdate({ assessment: newAssessment, score: computeOverallScore(newAssessment) });
    setConfirmOpen(false);
    notify("Assessment saved successfully.", "success");
  }

  const categories = [
    { key: "written", label: "Written / Knowledge Assessment", weight: DEFAULT_WEIGHTS.written },
    { key: "practical", label: "Practical Assessment", weight: DEFAULT_WEIGHTS.practical },
    { key: "operational", label: "Operational Performance", weight: DEFAULT_WEIGHTS.operational },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <SectionLabel>Manual Assessment — {driver.name}</SectionLabel>
          <Badge tone="slate">Driver ID: {driver.id}</Badge>
        </div>
        <p className="text-xs text-slate-400 mb-5">Categories and weights are placeholders for Phase 1 and are not yet finalized. Current certification: Level {driver.level}.</p>

        <div className="space-y-5">
          {categories.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">{c.label}</label>
                <span className="text-xs text-slate-400">Weight {Math.round(c.weight * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} max={100} value={marks[c.key]}
                  onChange={(e) => handleChange(c.key, e.target.value)}
                  className={cx("w-28 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                    errors[c.key] ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")}
                />
                <span className="text-sm text-slate-400">/ 100</span>
                <div className="flex-1"><ProgressBar value={Number(marks[c.key]) || 0} /></div>
              </div>
              {errors[c.key] && <p className="text-xs text-rose-600 mt-1">{errors[c.key]}</p>}
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">User Feedback (auto-calculated)</label>
              <span className="text-xs text-slate-400">Weight {Math.round(DEFAULT_WEIGHTS.feedback * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">{feedback100}</div>
              <span className="text-sm text-slate-400">/ 100</span>
              <div className="flex-1"><ProgressBar value={feedback100} tone="amber" /></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Derived from monthly average rating ({driver.assessment.feedbackAvg.toFixed(1)} ★ × 20).</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 h-fit">
        <SectionLabel>Overall Score</SectionLabel>
        <p className="text-4xl font-semibold text-slate-900 mt-1">{overall}%</p>
        <p className="text-xs text-slate-400 mt-1">Pass mark for Level {driver.level}: {PASS_MARKS[driver.level]}%</p>
        <ProgressBar value={overall} tone={overall >= PASS_MARKS[driver.level] ? "emerald" : "amber"} />
        <Button className="w-full mt-5" onClick={handleSaveClick}><ClipboardList className="h-4 w-4" /> Save Assessment</Button>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Save">
        <p className="text-sm text-slate-600 mb-5">Are you sure you want to save this assessment? Overall score will be updated to {overall}%.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function FeedbackList({ driverId }) {
  const items = FEEDBACK_LOG.filter((f) => f.driverId === driverId);
  if (items.length === 0) return <EmptyState title="No feedback yet" subtitle="Feedback submitted by passengers will appear here." icon={MessageSquare} />;
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={i} className="p-3 rounded-lg bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-mono">{f.passenger} · {f.date}</p>
            <p className="text-sm text-slate-700 mt-1">{f.comment}</p>
          </div>
          <StarRating value={f.rating} readOnly size="h-3.5 w-3.5" />
        </div>
      ))}
    </div>
  );
}

function AdminFeedback({ drivers, onOpenDriver }) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Feedback Review</h1>
        <p className="text-slate-500 text-sm mt-1">All passenger feedback submitted across drivers.</p>
      </div>
      <Card className="divide-y divide-slate-100">
        {FEEDBACK_LOG.map((f, i) => {
          const d = drivers.find((x) => x.id === f.driverId);
          return (
            <button key={i} onClick={() => onOpenDriver(f.driverId)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50">
              <Avatar name={d?.name || "?"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-slate-900">{d?.name}</p>
                  <StarRating value={f.rating} readOnly size="h-4 w-4" />
                </div>
                <p className="text-sm text-slate-500 mt-1">{f.comment}</p>
                <p className="text-xs text-slate-400 font-mono mt-1.5">{f.passenger} · {f.date}</p>
              </div>
            </button>
          );
        })}
      </Card>
    </div>
  );
}

function AdminSettings() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration for scoring, permissions and certification rules.</p>
      </div>
      <Card className="p-5 space-y-4">
        <SectionLabel>Scoring Model (Phase 1 Placeholder)</SectionLabel>
        {Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
            <span className="capitalize text-slate-600">{k}</span>
            <span className="font-mono text-slate-900">{Math.round(v * 100)}%</span>
          </div>
        ))}
        <p className="text-xs text-slate-400 pt-2">These weights, certification pass marks, ranking logic and admin permission levels are not finalized and remain configurable until confirmed by the project team.</p>
      </Card>
      <Card className="p-5">
        <SectionLabel>Certification Pass Marks</SectionLabel>
        <div className="grid grid-cols-5 gap-3 mt-2">
          {CERT_LEVELS.map((l) => (
            <div key={l} className="text-center rounded-lg bg-slate-50 py-3">
              <p className="text-xs text-slate-400">{l}</p>
              <p className="text-lg font-semibold text-slate-900">{PASS_MARKS[l]}%</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* =========================================================================
   DRIVER APPLICATION (mobile-first)
   ========================================================================= */

function MobileShell({ title, subtitle, onBack, children, nav, active, onNav, onExit }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 max-w-md mx-auto border-x border-slate-200">
      <TopBar title={title} subtitle={subtitle} onBack={onBack} right={
        <button onClick={onExit} className="text-xs text-slate-400 hover:text-slate-700">Exit</button>
      } />
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex">
        {nav.map((n) => (
          <button key={n.key} onClick={() => onNav(n.key)} className={cx("flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium", active === n.key ? "text-slate-900" : "text-slate-400")}>
            <n.icon className={cx("h-5 w-5", active === n.key && "text-amber-600")} />
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DriverApp({ drivers, notify, onExit }) {
  const driver = drivers.find((d) => d.id === "DRV-001"); // demo signed-in driver
  const [screen, setScreen] = useState("home");
  const [verifyState, setVerifyState] = useState("idle"); // idle | scanning | success | fail

  const nav = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "passport", label: "Passport", icon: CreditCard },
    { key: "certification", label: "Certify", icon: Award },
    { key: "qr", label: "QR", icon: QrCode },
    { key: "profile", label: "Profile", icon: User },
  ];

  const titles = { home: "Driver Home", passport: "Driver Passport", certification: "Certification", qr: "Driver QR Code", profile: "My Profile", verify: "QR Verification" };

  function runScan(valid = true) {
    setScreen("verify");
    setVerifyState("scanning");
    setTimeout(() => setVerifyState(valid ? "success" : "fail"), 1400);
  }

  return (
    <MobileShell
      title={titles[screen]} subtitle={screen !== "verify" ? driver.id : undefined}
      onBack={screen === "verify" ? () => { setScreen("qr"); setVerifyState("idle"); } : undefined}
      nav={nav} active={screen === "verify" ? "qr" : screen} onNav={setScreen} onExit={onExit}
    >
      {screen === "home" && <DriverHome driver={driver} onGo={setScreen} />}
      {screen === "passport" && <div className="p-5"><PassportCard driver={driver} /></div>}
      {screen === "certification" && <DriverCertification driver={driver} />}
      {screen === "qr" && <DriverQR driver={driver} onScan={runScan} />}
      {screen === "profile" && <DriverProfile driver={driver} />}
      {screen === "verify" && <QRVerify driver={driver} state={verifyState} onRetry={() => runScan(true)} onRetryFail={() => runScan(false)} />}
    </MobileShell>
  );
}

function DriverHome({ driver, onGo }) {
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={driver.name} size="h-14 w-14" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{driver.name}</p>
          <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <CertBadge status={driver.certStatus} />
            <Badge tone="slate">Level {driver.level}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 text-center">
        <Card className="p-4">
          <p className="text-2xl font-semibold text-slate-900">{driver.rating.toFixed(1)} ★</p>
          <p className="text-xs text-slate-400 mt-1">Rating</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-semibold text-slate-900">{driver.status}</p>
          <p className="text-xs text-slate-400 mt-1">Status</p>
        </Card>
      </div>

      <div className="space-y-3">
        <QuickCard icon={CreditCard} title="Driver Passport" desc="Your official professional identity" onClick={() => onGo("passport")} />
        <QuickCard icon={Award} title="Certification" desc={`Level ${driver.level} · ${driver.certStatus}`} onClick={() => onGo("certification")} />
        <QuickCard icon={QrCode} title="QR Code" desc="Scan to verify your identity" onClick={() => onGo("qr")} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Passenger Feedback QR</SectionLabel>
          <Badge tone="amber" icon={QrCode}>Feedback</Badge>
        </div>
        <p className="text-xs text-slate-400 mb-4">Passengers can scan this QR code to rate your service and provide feedback.</p>
        <div className="flex flex-col items-center bg-white rounded-xl p-4 border border-slate-200">
          <QRCodeSVG
            value="https://forms.gle/AwM49wXGSNYAGD7GA"
            size={160}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
            includeMargin={false}
          />
          <p className="text-xs text-slate-400 mt-3 font-mono">UAB Academy Feedback Form</p>
        </div>
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-slate-50">
          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Share this QR with passengers after completing their trip.</p>
        </div>
      </Card>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="w-full">
      <Card className="p-4 flex items-center gap-4 hover:border-slate-300 transition-colors">
        <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-amber-400" /></div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-slate-900 text-sm">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </Card>
    </button>
  );
}

function DriverProfile({ driver }) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center text-center py-3">
        <Avatar name={driver.name} size="h-20 w-20" />
        <h2 className="font-semibold text-lg text-slate-900 mt-3">{driver.name}</h2>
        <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        <div className="flex items-center gap-2 mt-2"><CertBadge status={driver.certStatus} /><StatusBadge status={driver.status} /></div>
      </div>
      <Card className="p-5 space-y-4">
        <SectionLabel>Professional Information</SectionLabel>
        <InfoRow icon={Award} label="Certification Level" value={`Level ${driver.level}`} />
        <InfoRow icon={Car} label="Assigned Vehicle" value={driver.vehicle} />
        <InfoRow icon={Clock} label="Joined Program" value={driver.joined} />
      </Card>
      <Card className="p-5 space-y-4">
        <SectionLabel>Contact Information</SectionLabel>
        <InfoRow icon={Phone} label="Phone" value={driver.phone} />
        <InfoRow icon={Mail} label="Email" value={driver.email} />
      </Card>
      <p className="text-xs text-slate-400 text-center px-4">Assessment marks are managed by Admin and cannot be edited from this profile.</p>
    </div>
  );
}

function PassportCard({ driver }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0b1220 0%, #182338 55%, #0b1220 100%)" }}>
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #d4af37 0%, transparent 70%)" }} />
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Shield className="h-5 w-5" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">PCCP Passport</span>
          </div>
          <BadgeCheck className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="flex items-center gap-4 mt-6">
          <div className="h-16 w-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-semibold text-lg">
            {driver.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">{driver.name}</p>
            <p className="text-slate-400 text-xs font-mono mt-0.5 tracking-wider">{driver.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-700/60">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Certification</p>
            <p className="text-white text-sm font-medium mt-0.5">Professional Chauffeur</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Level</p>
            <p className="text-white text-sm font-medium mt-0.5">Level {driver.level}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
            <p className="text-emerald-400 text-sm font-medium mt-0.5 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {driver.certStatus}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Valid Until</p>
            <p className="text-white text-sm font-medium mt-0.5">{driver.validUntil}</p>
          </div>
        </div>
      </div>
      <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #d4af37, #f3d68a, #d4af37)" }} />
    </div>
  );
}

function DriverCertification({ driver }) {
  const feedback100 = feedbackTo100(driver.assessment.feedbackAvg);
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Current Level</SectionLabel>
            <p className="text-2xl font-semibold text-slate-900">Level {driver.level}</p>
          </div>
          <CertBadge status={driver.certStatus} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-xs text-slate-400">Overall Performance</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{driver.score}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Rating</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{driver.rating.toFixed(1)} ★</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>Assessment Summary</SectionLabel>
        {[["Written", driver.assessment.written], ["Practical", driver.assessment.practical], ["Operational", driver.assessment.operational], ["Feedback", feedback100]].map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span className="font-medium text-slate-700">{val}%</span></div>
            <ProgressBar value={val} tone="amber" />
          </div>
        ))}
      </Card>
      <p className="text-xs text-slate-400 text-center px-4">Certification calculation is a Phase 1 placeholder pending confirmation by the project team.</p>
    </div>
  );
}

function DriverQR({ driver, onScan }) {
  return (
    <div className="p-5 flex flex-col items-center">
      <Card className="p-8 flex flex-col items-center w-full">
        <QRVisual seed={driver.id} />
        <p className="font-semibold text-slate-900 mt-5">{driver.name}</p>
        <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        <p className="text-xs text-slate-400 mt-3">Scan to verify driver</p>
        <Badge tone="emerald" icon={CheckCircle2}>Verified</Badge>
      </Card>
      <div className="flex gap-2 w-full mt-4">
        <Button variant="outline" className="flex-1"><RefreshCw className="h-4 w-4" /> Refresh QR</Button>
        <Button className="flex-1" onClick={() => onScan(true)}><ScanLine className="h-4 w-4" /> Simulate Scan</Button>
      </div>
    </div>
  );
}

function QRVisual({ seed = "DRV-001", size = 176 }) {
  // Deterministic pseudo-QR pattern for prototype purposes (not a real scannable code)
  const cells = 12;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  const rand = (i) => { h = (h * 9301 + 49297 + i) % 233280; return h / 233280; };
  const grid = Array.from({ length: cells * cells }, (_, i) => rand(i) > 0.52);
  const cell = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg border border-slate-200">
      <rect width={size} height={size} fill="white" />
      {grid.map((on, i) => {
        const x = (i % cells) * cell, y = Math.floor(i / cells) * cell;
        return on ? <rect key={i} x={x} y={y} width={cell} height={cell} fill="#0f172a" /> : null;
      })}
      {[[0, 0], [1, 0], [0, 1]].map(([cx_, cy_], idx) => (
        <g key={idx} transform={`translate(${cx_ * (size - 3 * cell)}, ${cy_ * (size - 3 * cell)})`}>
          <rect width={cell * 3} height={cell * 3} fill="#0f172a" />
          <rect x={cell * 0.5} y={cell * 0.5} width={cell * 2} height={cell * 2} fill="white" />
          <rect x={cell} y={cell} width={cell} height={cell} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}

function QRVerify({ driver, state, onRetry, onRetryFail }) {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[70vh] text-center">
      {state === "scanning" && (
        <>
          <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
          <p className="text-slate-500 text-sm mt-4">Verifying QR code…</p>
        </>
      )}
      {state === "success" && (
        <>
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Driver Verified</h2>
          <Badge tone="emerald" icon={CheckCircle2}>Verified</Badge>
          <Card className="p-5 mt-5 w-full text-left">
            <InfoRow icon={User} label="Driver" value={driver.name} />
            <div className="h-3" />
            <InfoRow icon={CreditCard} label="Driver ID" value={driver.id} mono />
            <div className="h-3" />
            <InfoRow icon={Award} label="Certification" value={`Professional Chauffeur — Level ${driver.level}`} />
            <div className="h-3" />
            <InfoRow icon={Shield} label="Status" value={driver.status} />
          </Card>
          <Button variant="outline" className="w-full mt-4" onClick={onRetryFail}>Simulate Failed Scan</Button>
        </>
      )}
      {state === "fail" && (
        <>
          <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mb-4"><XCircle className="h-8 w-8 text-rose-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Verification Failed</h2>
          <p className="text-slate-500 text-sm mt-2">Unable to verify this QR code.</p>
          <Button className="w-full mt-6" onClick={onRetry}>Try Again</Button>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   PASSENGER APPLICATION (mobile-first)
   ========================================================================= */

function PassengerApp({ drivers, notify, onExit }) {
  const [screen, setScreen] = useState("id"); // id | home | whereto | driverinfo | ranking | feedback | success
  const [destination, setDestination] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const passengerId = "PAS-00128";

  const activeDrivers = drivers.filter((d) => d.status === "Active");
  const ranked = [...activeDrivers].sort((a, b) => b.rating - a.rating);

  const nav = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "whereto", label: "Where-To", icon: MapPin },
    { key: "ranking", label: "Ranking", icon: TrendingUp },
    { key: "profile", label: "Profile", icon: User },
  ];

  function confirmDestination(dest) {
    setDestination(dest);
    const chosen = ranked[0];
    setAssignedDriver(chosen);
    setScreen("driverinfo");
  }

  const titles = { id: "Passenger ID", home: "Where To?", whereto: "Where-To", driverinfo: "Driver Information", ranking: "Driver Ranking", feedback: "Rate Your Driver", success: "Feedback Submitted", profile: "Passenger Profile" };

  if (screen === "id") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="max-w-sm w-full text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-600 flex items-center justify-center mx-auto mb-6"><CreditCard className="h-7 w-7 text-white" /></div>
          <p className="text-slate-400 text-sm">Passenger ID</p>
          <p className="text-3xl font-semibold text-white font-mono mt-1 tracking-wider">{passengerId}</p>
          <Button className="w-full mt-8" onClick={() => setScreen("home")}>Continue as Passenger</Button>
          <div className="mt-6"><RoleSwitchFooter onExit={onExit} label="Exit demo role" /></div>
        </div>
      </div>
    );
  }

  return (
    <MobileShell
      title={titles[screen]} subtitle={screen !== "home" ? passengerId : undefined}
      onBack={["driverinfo", "feedback", "success"].includes(screen) ? () => setScreen(screen === "success" ? "home" : "home") : undefined}
      nav={nav} active={["whereto", "driverinfo", "feedback", "success"].includes(screen) ? "whereto" : screen}
      onNav={setScreen} onExit={onExit}
    >
      {screen === "home" && (
        <PassengerHome passengerId={passengerId} ranked={ranked} onWhereTo={() => setScreen("whereto")} onRanking={() => setScreen("ranking")} onProfile={() => setScreen("profile")} />
      )}
      {screen === "whereto" && <WhereTo onConfirm={confirmDestination} />}
      {screen === "driverinfo" && assignedDriver && (
        <PassengerDriverInfo driver={assignedDriver} destination={destination} rank={ranked.findIndex((d) => d.id === assignedDriver.id) + 1}
          onFeedback={() => setScreen("feedback")} onViewPassport={() => notify("Driver Passport preview shared with passenger.", "info")} />
      )}
      {screen === "ranking" && <PassengerRanking ranked={ranked} onSelect={(d) => { setAssignedDriver(d); setScreen("driverinfo"); }} />}
      {screen === "feedback" && assignedDriver && (
        <PassengerFeedback driver={assignedDriver} onSubmit={() => setScreen("success")} />
      )}
      {screen === "success" && assignedDriver && <FeedbackSuccess driver={assignedDriver} onHome={() => setScreen("home")} />}
      {screen === "profile" && <PassengerProfile passengerId={passengerId} />}
    </MobileShell>
  );
}

function PassengerHome({ passengerId, ranked, onWhereTo, onRanking, onProfile }) {
  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">Passenger ID <span className="font-mono text-slate-500">{passengerId}</span></p>
        <h2 className="text-xl font-semibold text-slate-900 mt-1">Where do you want to go?</h2>
      </div>

      <button onClick={onWhereTo} className="w-full text-left">
        <Card className="p-5 bg-slate-900 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-600 flex items-center justify-center"><Navigation className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-white font-semibold">Where-To</p>
              <p className="text-slate-400 text-xs mt-0.5">Enter your destination</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 ml-auto" />
          </div>
        </Card>
      </button>

      <div>
        <SectionLabel>Recent Destinations</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS.slice(0, 3).map((d) => (
            <span key={d} className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600">{d}</span>
          ))}
        </div>
      </div>

      <button onClick={onRanking} className="w-full">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-slate-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">Driver Ranking</p>
            <p className="text-xs text-slate-400 mt-0.5">Top-rated certified chauffeurs</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>

      <button onClick={onProfile} className="w-full">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center"><User className="h-5 w-5 text-slate-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">Passenger Profile</p>
            <p className="text-xs text-slate-400 mt-0.5">View your passenger ID</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>
    </div>
  );
}

function WhereTo({ onConfirm }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const suggestions = DESTINATIONS.filter((d) => d.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-5 space-y-5">
      <div className="relative">
        <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Enter destination"
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
      </div>

      <div>
        <SectionLabel>Suggested Destinations</SectionLabel>
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <EmptyState title="No destination found" subtitle="Try a different search term." icon={MapPin} />
          ) : suggestions.map((d) => (
            <button key={d} onClick={() => setSelected(d)} className="w-full">
              <Card className={cx("p-3.5 flex items-center gap-3", selected === d && "ring-2 ring-slate-900")}>
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-800">{d}</span>
                {selected === d && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" disabled={!selected} onClick={() => onConfirm(selected)}>Confirm Destination</Button>
    </div>
  );
}

function PassengerDriverInfo({ driver, destination, rank, onFeedback, onViewPassport }) {
  return (
    <div className="p-5 space-y-5">
      {destination && (
        <Card className="p-4 flex items-center gap-3 bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">Destination confirmed: <span className="font-medium">{destination}</span></p>
        </Card>
      )}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={driver.name} size="h-16 w-16" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{driver.name}</p>
            <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <CertBadge status={driver.certStatus} />
              <Badge tone="slate">Level {driver.level}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 text-center">
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">{driver.rating.toFixed(1)} ★</p>
            <p className="text-[11px] text-slate-400">Rating</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">#{rank}</p>
            <p className="text-[11px] text-slate-400">Ranking</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-emerald-600">Verified</p>
            <p className="text-[11px] text-slate-400">Status</p>
          </div>
        </div>
      </Card>
      <Button variant="outline" className="w-full" onClick={onViewPassport}><CreditCard className="h-4 w-4" /> View Driver Passport</Button>
      <Button className="w-full" onClick={onFeedback}><Star className="h-4 w-4" /> Rate This Driver</Button>
    </div>
  );
}

function PassengerRanking({ ranked, onSelect }) {
  if (ranked.length === 0) return <div className="p-5"><EmptyState title="No ranking data" subtitle="No active drivers are currently available." icon={TrendingUp} /></div>;
  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-slate-400 bg-slate-100 rounded-lg p-3">{RANK_WEIGHTING_NOTE}</p>
      <div className="space-y-2">
        {ranked.map((d, i) => (
          <button key={d.id} onClick={() => onSelect(d)} className="w-full">
            <Card className={cx("p-4 flex items-center gap-4", i === 0 && "ring-1 ring-amber-300 bg-amber-50/40")}>
              <div className={cx("h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-300 text-slate-800" : i === 2 ? "bg-amber-800/70 text-white" : "bg-slate-100 text-slate-500")}>
                {i + 1}
              </div>
              <Avatar name={d.name} size="h-10 w-10" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-slate-900 text-sm truncate">{d.name}</p>
                <p className="text-xs text-slate-400">Level {d.level}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{d.rating.toFixed(1)} ★</p>
                <CertBadge status={d.certStatus} />
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function PassengerFeedback({ driver, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit() {
    const errs = {};
    if (rating === 0) errs.rating = "Please select a rating.";
    if (!comment.trim()) errs.comment = "Please enter your feedback.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit();
  }

  return (
    <div className="p-5 space-y-6">
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={driver.name} />
        <div>
          <p className="font-medium text-slate-900">{driver.name}</p>
          <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        </div>
      </Card>

      <div className="text-center">
        <SectionLabel>Rating</SectionLabel>
        <div className="flex justify-center mt-2"><StarRating value={rating} onChange={setRating} /></div>
        {errors.rating && <p className="text-xs text-rose-600 mt-2">{errors.rating}</p>}
      </div>

      <div>
        <SectionLabel>Comment</SectionLabel>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
          placeholder="Tell us about your experience."
          className={cx("w-full rounded-xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 resize-none bg-white",
            errors.comment ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
        {errors.comment && <p className="text-xs text-rose-600 mt-1">{errors.comment}</p>}
      </div>

      <Button className="w-full" onClick={handleSubmit}>Submit Feedback</Button>
    </div>
  );
}

function FeedbackSuccess({ driver, onHome }) {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
      <h2 className="text-xl font-semibold text-slate-900">Feedback Submitted Successfully</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-xs">Thank you for helping us improve our chauffeur service.</p>
      <Card className="p-4 mt-5 w-full flex items-center gap-3">
        <Avatar name={driver.name} size="h-9 w-9" />
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-slate-900">{driver.name}</p>
        </div>
        <StarRating value={5} readOnly size="h-4 w-4" />
      </Card>
      <Button className="w-full mt-6" onClick={onHome}>Return Home</Button>
    </div>
  );
}

function PassengerProfile({ passengerId }) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center text-center py-3">
        <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center"><CreditCard className="h-7 w-7 text-amber-400" /></div>
        <p className="text-slate-400 text-sm mt-3">Passenger ID</p>
        <p className="font-mono text-lg font-semibold text-slate-900">{passengerId}</p>
      </div>
      <Card className="p-5 text-sm text-slate-500">
        Passenger accounts are identified by Passenger ID only in this Phase 1 prototype. Full profile management is out of scope for Phase 1.
      </Card>
    </div>
  );
}
