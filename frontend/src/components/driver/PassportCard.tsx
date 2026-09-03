import { Card, CertBadge, th } from "../ui";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Calendar, CreditCard, Award } from "lucide-react";
import type { Driver } from "../../types";

export default function PassportCard({ driver }: { driver: Driver }) {
  const certToneMap: Record<string, string> = {
    CD: "from-slate-700 to-slate-800",
    CC: "from-blue-600 to-blue-800",
    CPC: "from-purple-600 to-purple-800",
    CEC: "from-amber-600 to-amber-800",
    CMC: "from-rose-600 to-rose-800",
  };

  const bg = certToneMap[driver.certLevel] || "from-slate-700 to-slate-800";

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl p-6 text-white shadow-xl`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-white/80" />
          <span className="text-sm font-medium opacity-80">PCCP Driver Passport</span>
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
          <h3 className="text-xl font-bold">{driver.name}</h3>
          <p className="text-sm opacity-80 font-mono">{driver.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <CreditCard className="w-4 h-4 mx-auto mb-1 opacity-80" />
          <p className="text-lg font-bold">{driver.score}</p>
          <p className="text-xs opacity-70">Score</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <Award className="w-4 h-4 mx-auto mb-1 opacity-80" />
          <p className="text-lg font-bold">{driver.rating}</p>
          <p className="text-xs opacity-70">Rating</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <Calendar className="w-4 h-4 mx-auto mb-1 opacity-80" />
          <p className="text-lg font-bold">{driver.credits}</p>
          <p className="text-xs opacity-70">Credits</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm opacity-80">
        <div>
          <p className="opacity-70 text-xs">Valid Until</p>
          <p className="font-medium">{driver.validUntil || "—"}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">English Level</p>
          <p className="font-medium">{driver.englishLevel || "—"}</p>
        </div>
        <div>
          <p className="opacity-70 text-xs">Accident Free</p>
          <p className="font-medium">{driver.accidentFree || "—"}</p>
        </div>
      </div>
    </div>
  );
}
