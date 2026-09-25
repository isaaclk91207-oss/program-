import { CertBadge, Icon } from "../ui";
import { QRCodeSVG } from "qrcode.react";
import type { Driver } from "../../types";

const CERT_ORDER = ["CD", "CC", "CPC", "CEC", "CMC"];

const CERT_TITLES: Record<string, string> = {
  CD: "Certified Driver",
  CC: "Certified Chauffeur",
  CPC: "Certified Professional Chauffeur",
  CEC: "Certified Executive Chauffeur",
  CMC: "Certified Master Chauffeur",
};

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function nextCertLevel(level: string): string | null {
  const i = CERT_ORDER.indexOf(level);
  if (i < 0 || i >= CERT_ORDER.length - 1) return null;
  return CERT_ORDER[i + 1];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
      <p className="font-label-caps text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white mt-1 truncate">{value}</p>
    </div>
  );
}

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85">
      <Icon name={icon} size={14} className="text-white/60" />
      {children}
    </span>
  );
}

export default function PassportCard({
  driver,
  className = "max-w-md mx-auto",
}: {
  driver: Driver;
  className?: string;
}) {
  const next = nextCertLevel(driver.certLevel);
  const certified = driver.certStatus === "CERTIFIED";
  const certTitle = CERT_TITLES[driver.certLevel] || "Certified";

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] via-[#0a1120] to-[#070d1a] text-white shadow-2xl overflow-hidden ${className}`}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/pccp-logo.png"
              alt="PCCP"
              className="w-9 h-9 rounded-lg object-contain bg-white shrink-0"
            />
            <div className="min-w-0">
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-[#e8c26a]">PCCP Academy</p>
              <p className="font-title-md text-title-md font-semibold text-white truncate">Digital Driver Passport</p>
            </div>
          </div>
          {certified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8c26a]/60 bg-[#e8c26a]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#e8c26a] shrink-0">
              <Icon name="verified" size={14} fill />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 shrink-0">
              <Icon name="shield" size={14} />
              {driver.certStatus}
            </span>
          )}
        </div>

        {/* Body: avatar | info | cert + QR */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr_220px]">
          {/* Avatar + ID */}
          <div className="flex lg:block items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] ring-2 ring-white/15 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-white">{initials(driver.name)}</span>
            </div>
            <div className="lg:mt-3 lg:text-center">
              <span className="inline-block rounded-md bg-[#e8c26a]/15 border border-[#e8c26a]/40 px-2 py-0.5 font-mono text-xs font-semibold text-[#e8c26a]">
                {getDisplayId(driver)}
              </span>
            </div>
          </div>

          {/* Identity + info grid + badges */}
          <div className="min-w-0">
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-white/50">Driver</p>
            <h3 className="font-headline-md text-headline-md font-bold text-white mt-0.5 truncate">{driver.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-mono text-white/60">{driver.id}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    driver.status === "Active" || driver.status === "AVAILABLE" ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {driver.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                {driver.englishLevel ? `English ${driver.englishLevel}` : "Driver"}
              </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
              <Field label="Certified Since" value={formatDate(driver.joinedDate)} />
              <Field label="Valid Until" value={formatDate(driver.validUntil)} />
              <Field label="English Level" value={driver.englishLevel || "—"} />
              <Field label="Accident-Free" value={driver.accidentFree || "—"} />
              <Field label="Feedback" value={`${driver.rating} / 5`} />
              <Field label="Credits" value={String(driver.credits ?? 0)} />
            </div>

            {/* Badge pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Pill icon="workspace_premium">
                {next ? (
                  <>
                    <span className="text-[#e8c26a] font-semibold">Next: {next}</span>
                    <span className="text-white/50">· {CERT_TITLES[next]}</span>
                  </>
                ) : (
                  <span className="text-[#e8c26a] font-semibold">Top Level: {driver.certLevel}</span>
                )}
              </Pill>
              <Pill icon="star">Safety {driver.score}</Pill>
              <Pill icon="directions_car">
                {driver.currentVehiclePlate ? (
                  <span className="font-mono">{driver.currentVehiclePlate}</span>
                ) : (
                  "No vehicle"
                )}
              </Pill>
            </div>
          </div>

          {/* Cert hexagon + QR */}
          <div className="lg:border-l lg:border-white/10 lg:pl-5">
            <div className="flex flex-col items-center">
              <div
                className="w-24 h-[108px] flex items-center justify-center shadow-lg shadow-blue-900/40"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  background: "linear-gradient(160deg, #3b82f6 0%, #1d4ed8 100%)",
                }}
              >
                <span className="text-3xl font-bold text-white">{driver.certLevel}</span>
              </div>
              <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#e8c26a]">
                {driver.certLevel} {certTitle}
              </p>

              <div className="mt-4 bg-white rounded-xl p-2.5 shadow-lg">
                <QRCodeSVG value={driver.id} size={124} level="M" />
              </div>
              <p className="mt-2 font-label-caps text-[10px] uppercase tracking-widest text-[#e8c26a]">
                Scan for Feedback
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Icon name="badge" size={16} className="text-[#e8c26a]" />
          <span className="font-label-caps uppercase tracking-wider">PCCP Vector · Driver Passport</span>
        </div>
        <CertBadge level={driver.certLevel} />
      </div>
    </div>
  );
}
