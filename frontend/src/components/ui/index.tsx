import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useTheme as useAppTheme } from "../../context/ThemeContext";

// ─── Theme-aware class helpers ──────────────────────────────────────────────

export const th = {
  bg: "bg-surface-canvas dark:bg-navy-950",
  bgCard: "bg-surface dark:bg-navy-900",
  bgElevated: "bg-surface-container-low dark:bg-navy-900",
  bgInput: "bg-surface-container-low dark:bg-navy-900",
  border: "border-border-hairline dark:border-outline-variant",
  borderHover: "hover:border-outline dark:hover:border-outline-variant",
  text: "text-on-surface dark:text-white",
  textSecondary: "text-on-surface-variant dark:text-outline-variant",
  textMuted: "text-outline dark:text-outline-variant",
  dangerText: "text-error dark:text-rose-400",
  sidebar: "bg-surface dark:bg-inverse-surface border-r border-border-hairline dark:border-outline-variant",
  header: "bg-surface dark:bg-inverse-surface border-b border-border-hairline dark:border-outline-variant",
  bottomNav: "bg-surface dark:bg-inverse-surface border-t border-border-hairline dark:border-outline-variant",
  canvas: "bg-surface-canvas dark:bg-navy-950 text-on-surface dark:text-white",
  cardSurface: "bg-surface dark:bg-navy-900 border border-border-hairline dark:border-outline-variant",
  roleDriver: "text-role-driver dark:text-purple-400",
  roleDriverContainer: "bg-role-driver-container text-role-driver dark:bg-purple-500/20 dark:text-purple-400",
  rolePassenger: "text-role-passenger dark:text-blue-400",
  rolePassengerContainer: "bg-role-passenger-container text-role-passenger dark:bg-blue-500/20 dark:text-blue-400",
  roleAdmin: "text-role-admin dark:text-emerald-400",
  roleAdminContainer: "bg-role-admin-container text-role-admin dark:bg-emerald-500/20 dark:text-emerald-400",
  hairline: "border-border-hairline dark:border-outline-variant",
  tableHeader: "bg-surface-container-low dark:bg-navy-900 text-on-surface-variant dark:text-outline-variant text-xs font-semibold uppercase tracking-wider",
  tableRow: "border-b border-border-hairline dark:border-outline-variant",
  tableRowHover: "bg-surface-container-low/50 dark:bg-navy-800/40",
};

// ─── DataTable ─────────────────────────────────────────────────────────────

export function DataTable({
  headers,
  children,
}: {
  headers: React.ReactNode[] | string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-hairline dark:border-outline-variant">
      <table className="w-full text-sm">
        <thead className={th.tableHeader}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick, hover = true }: { children: React.ReactNode; onClick?: () => void; hover?: boolean }) {
  return (
    <tr
      onClick={onClick}
      className={`${th.tableRow} ${onClick && hover ? `cursor-pointer transition-colors hover:${th.tableRowHover}` : ""}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${th.text} ${className}`}>{children}</td>;
}

// ─── Icon (Material Symbols) ─────────────────────────────────────────────────

interface IconProps {
  name: string;
  fill?: boolean;
  size?: number;
  weight?: number;
  className?: string;
}

export function Icon({ name, fill = false, size = 24, weight = 400, className = "" }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      aria-hidden
      style={{
        fontFamily: "'Material Symbols Outlined'",
        fontWeight: "normal",
        fontStyle: "normal",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        display: "inline-block",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        direction: "ltr",
        fontFeatureSettings: "'liga'",
        WebkitFontSmoothing: "antialiased",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      } as React.CSSProperties}
    >
      {name}
    </span>
  );
}

// ─── TripStatusPill (driver trip status) ────────────────────────────────────

const DONE_STATUSES = ["FEEDBACK_SUBMITTED", "COMPLETED", "DROPOFF_COMPLETE", "DROP_OFF_SCANNED"];
const CANCELLED_STATUSES = ["CANCELLED", "CANCELED", "REJECTED", "EXPIRED"];

export function tripStatusMeta(status: string): { pillClass: string; label: string } {
  let pillClass = "bg-role-driver-container text-role-driver dark:bg-purple-500/20 dark:text-purple-400";
  if (DONE_STATUSES.includes(status)) {
    pillClass = "bg-role-admin-container text-role-admin dark:bg-emerald-500/20 dark:text-emerald-400";
  } else if (CANCELLED_STATUSES.includes(status)) {
    pillClass = "bg-error-container text-error dark:bg-rose-500/20 dark:text-rose-400";
  }
  return { pillClass, label: status.replace(/_/g, " ") };
}

export function TripStatusPill({ status }: { status: string }) {
  const { pillClass, label } = tripStatusMeta(status);
  return (
    <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps uppercase ${pillClass}`}>
      {label}
    </span>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────

const BADGE_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  QR_PENDING: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  PICK_UP_SCANNED: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
  DROP_OFF_SCANNED: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30",
  FEEDBACK_SUBMITTED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  RETIRED: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30",
  CERTIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  PENDING_CERT: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  SUSPENDED: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  REVOKED: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
  CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
  CHECKED_OUT: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
};

export function Badge({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        BADGE_COLORS[status] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
      }`}
    >
      {children}
    </span>
  );
}

// ─── CertBadge ──────────────────────────────────────────────────────────────

const CERT_COLORS: Record<string, string> = {
  CD: "bg-slate-500 dark:bg-slate-600",
  CC: "bg-blue-500 dark:bg-blue-600",
  CPC: "bg-purple-500 dark:bg-purple-600",
  CEC: "bg-amber-500 dark:bg-amber-600",
  CMC: "bg-rose-500 dark:bg-rose-600",
};

export function CertBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white ${
        CERT_COLORS[level] || "bg-slate-500 dark:bg-slate-600"
      }`}
    >
      {level}
    </span>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  accent?: "system" | "driver" | "passenger" | "admin";
  loading?: boolean;
}

const BUTTON_ACCENT: Record<string, string> = {
  system: "bg-primary hover:bg-primary-container text-white",
  driver: "bg-role-driver hover:bg-[#6d28d9] text-white",
  passenger: "bg-role-passenger hover:bg-blue-700 text-white",
  admin: "bg-role-admin hover:bg-emerald-600 text-white",
};

export function Button({
  variant = "primary",
  size = "md",
  accent = "system",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: BUTTON_ACCENT[accent],
    secondary: "bg-surface-container-low hover:bg-surface-container text-on-surface border border-border-hairline dark:border-outline-variant dark:text-slate-100",
    danger: "bg-error hover:bg-rose-700 text-on-error",
    ghost: "bg-transparent hover:bg-surface-container-low text-on-surface-variant dark:text-slate-300",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Icon name="progress_activity" size={16} className="animate-spin -ml-1 mr-2" />}
      {children}
    </button>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`${th.bgCard} border ${th.border} rounded-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative ${th.bgCard} border ${th.border} rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className={`flex items-center justify-between px-6 py-4 border-b ${th.border}`}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className={`${th.textSecondary} hover:${th.text}`}>
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── StarRating ─────────────────────────────────────────────────────────────

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Icon
            name="star"
            fill={star <= value}
            size={size === "sm" ? 16 : size === "md" ? 24 : 32}
            className={`${
              star <= value ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── LoadingSpinner ─────────────────────────────────────────────────────────

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "16", md: "32", lg: "48" };
  return (
    <div className="flex items-center justify-center p-8">
      <Icon name="progress_activity" size={Number(sizes[size])} className="animate-spin text-primary" />
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${th.textMuted}`}>
      {icon || <Icon name="inbox" size={40} className="mb-3" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── KPICard ────────────────────────────────────────────────────────────────

export function KPICard({
  label,
  value,
  icon,
  color = "amber",
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
}) {
  const colors: Record<string, string> = {
    amber: "text-amber-500 dark:text-amber-400",
    blue: "text-blue-500 dark:text-blue-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    purple: "text-purple-500 dark:text-purple-400",
    rose: "text-rose-500 dark:text-rose-400",
    cyan: "text-cyan-500 dark:text-cyan-400",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${th.textSecondary} uppercase tracking-wider`}>{label}</p>
          <p className={`text-2xl font-bold ${colors[color] || th.text}`}>{value}</p>
        </div>
        {icon && <div className={`${colors[color] || th.text}`}>{icon}</div>}
      </div>
    </Card>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  color = "amber",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${colors[color] || "bg-amber-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={`${sizes[size]} bg-surface-container-high text-on-surface rounded-full flex items-center justify-center font-bold ${className}`}
    >
      {initials}
    </div>
  );
}

// ─── Toast System ───────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const ToastContext = createContext<{
  addToast: (type: Toast["type"], message: string) => void;
}>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <Icon name="check_circle" size={20} className="text-emerald-500" />,
    error: <Icon name="error" size={20} className="text-rose-500" />,
    info: <Icon name="info" size={20} className="text-blue-500" />,
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${th.bgCard} border ${th.border} rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[280px] animate-in slide-in-from-right`}
          >
            {icons[t.type]}
            <p className={`text-sm flex-1 ${th.text}`}>{t.message}</p>
            <button onClick={() => removeToast(t.id)} className={th.textMuted}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            active === tab.key
              ? "border-primary text-primary"
              : `border-transparent ${th.textSecondary} hover:${th.text}`
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── SearchInput ────────────────────────────────────────────────────────────

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-outline-variant" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} placeholder:text-outline dark:placeholder:text-outline-variant focus:outline-none focus:border-primary`}
      />
    </div>
  );
}

// ─── Form Primitives ────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  helpText,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
  helpText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      {label && <label className={`block text-sm ${th.textSecondary} mb-1`}>{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-primary ${error ? "border-error" : ""}`}
        {...props}
      />
      {helpText && <p className={`text-xs ${th.textMuted} mt-1`}>{helpText}</p>}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  options,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      {label && <label className={`block text-sm ${th.textSecondary} mb-1`}>{label}</label>}
      <div className="relative">
        <select
          className={`w-full px-3 py-2 text-sm rounded-lg border appearance-none ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-primary ${error ? "border-error" : ""}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Icon name="expand_more" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline dark:text-outline-variant pointer-events-none" />
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      {label && <label className={`block text-sm ${th.textSecondary} mb-1`}>{label}</label>}
      <textarea
        className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-primary ${error ? "border-error" : ""}`}
        {...props}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

// ─── ConfirmDialog ──────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative ${th.bgCard} border ${th.border} rounded-xl max-w-sm w-full mx-4 p-6`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className={`text-sm ${th.textSecondary} mb-6`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── ThemeToggle ────────────────────────────────────────────────────────────

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useAppTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg ${th.textSecondary} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Icon name="light_mode" size={20} /> : <Icon name="dark_mode" size={20} />}
    </button>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
  );
}
