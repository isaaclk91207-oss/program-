import { CertBadge, Icon } from "../ui";
import { QRCodeSVG } from "qrcode.react";
import type { Driver } from "../../types";

export default function PassportCard({ driver }: { driver: Driver }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon name="badge" size={24} className="text-white/80" />
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-white/80">PCCP Driver Passport</span>
          </div>
          <CertBadge level={driver.certLevel} />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">
              {(driver.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-title-lg text-title-lg font-bold">{driver.name}</h3>
            <p className="font-body-sm text-body-sm text-white/80 font-mono">{driver.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Icon name="monitoring" size={20} className="mx-auto mb-1 opacity-80" />
            <p className="text-xl font-bold">{driver.score}</p>
            <p className="font-label-caps text-label-caps uppercase opacity-70">Score</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Icon name="star" size={20} className="mx-auto mb-1 opacity-80" />
            <p className="text-xl font-bold">{driver.rating}</p>
            <p className="font-label-caps text-label-caps uppercase opacity-70">Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="opacity-70 font-label-caps text-label-caps uppercase mb-1">Valid Until</p>
            <p className="font-body-sm text-body-sm font-medium">{driver.validUntil || "—"}</p>
          </div>
          <div>
            <p className="opacity-70 font-label-caps text-label-caps uppercase mb-1">English Level</p>
            <p className="font-body-sm text-body-sm font-medium">{driver.englishLevel || "—"}</p>
          </div>
          <div>
            <p className="opacity-70 font-label-caps text-label-caps uppercase mb-1">Accident Free</p>
            <p className="font-body-sm text-body-sm font-medium">{driver.accidentFree || "—"}</p>
          </div>
        </div>
      </div>

      {/* QR */}
      <div className="mt-5 bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-5 text-center">
        <div className="bg-white dark:bg-white rounded-xl p-4 inline-block">
          <QRCodeSVG value={driver.id} size={160} level="M" />
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-3">
          Scan to verify chauffeur certification
        </p>
      </div>
    </div>
  );
}