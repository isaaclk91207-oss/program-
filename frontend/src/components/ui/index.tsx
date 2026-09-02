import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  Star,
  Loader2,
  Inbox,
  X,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Check,
  AlertCircle,
  Info,
  Bell,
  Trash2,
} from "lucide-react";
import { useTheme as useAppTheme } from "../../context/ThemeContext";

// ─── Theme-aware class helpers ──────────────────────────────────────────────

export const th = {
  bg: "bg-white dark:bg-navy-950",
  bgCard: "bg-white dark:bg-navy-900",
  bgElevated: "bg-slate-50 dark:bg-navy-900",
  bgInput: "bg-slate-100 dark:bg-slate-800",
  border: "border-slate-200 dark:border-slate-800",
  borderHover: "hover:border-slate-300 dark:hover:border-slate-700",
  text: "text-slate-900 dark:text-white",
  textSecondary: "text-slate-600 dark:text-slate-400",
  textMuted: "text-slate-400 dark:text-slate-500",
  sidebar: "bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-slate-800",
  header: "bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-slate-800",
  bottomNav: "bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-slate-800",
};

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
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-navy-950",
    secondary: "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
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
      {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
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
              <X className="w-5 h-5" />
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
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

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
          <Star
            className={`${sizes[size]} ${
              star <= value ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── LoadingSpinner ─────────────────────────────────────────────────────────

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`animate-spin ${sizes[size]} text-amber-500`} />
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${th.textMuted}`}>
      {icon || <Inbox className="w-12 h-12 mb-3" />}
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
  const initials = name
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
      className={`${sizes[size]} bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center font-bold ${className}`}
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
    success: <Check className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
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
              <X className="w-4 h-4" />
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
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} placeholder:text-slate-400 focus:outline-none focus:border-amber-500`}
      />
    </div>
  );
}

// ─── Form Primitives ────────────────────────────────────────────────────────

export function Input({
  label,
  error,
  className = "",
  ...props
}: {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      {label && <label className={`block text-sm ${th.textSecondary} mb-1`}>{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500 ${error ? "border-rose-500" : ""}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
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
          className={`w-full px-3 py-2 text-sm rounded-lg border appearance-none ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500 ${error ? "border-rose-500" : ""}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
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
        className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500 ${error ? "border-rose-500" : ""}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
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
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
  );
}
