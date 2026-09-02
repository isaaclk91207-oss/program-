import { useState, useEffect } from "react";
import { Card, Button, th } from "../ui";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

type ScanState = "idle" | "scanning" | "success" | "error";

export default function QRScan({
  vehiclePlate,
  onScanComplete,
  onBack,
}: {
  vehiclePlate: string;
  onScanComplete: (verified: boolean) => void;
  onBack: () => void;
}) {
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setState("scanning");
    setProgress(0);
  };

  useEffect(() => {
    if (state !== "scanning") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const success = Math.random() > 0.2;
          setState(success ? "success" : "error");
          return 100;
        }
        return p + 5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <Card className="p-6 text-center">
        <div className="mb-4">
          <QrCode className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">QR Verification</h3>
          <p className={`text-sm ${th.textSecondary}`}>Verify vehicle: <span className="font-mono">{vehiclePlate}</span></p>
        </div>

        {state === "idle" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG value={vehiclePlate} size={160} level="M" />
            </div>
            <p className={`text-xs ${th.textMuted}`}>Show this QR code to the passenger, or scan the passenger's QR code</p>
            <Button onClick={startScan} className="w-full">
              <QrCode className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}

        {state === "scanning" && (
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className={`text-sm ${th.textSecondary}`}>Scanning QR code...</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <h4 className="text-lg font-semibold text-emerald-500">Verification Successful</h4>
              <p className={`text-sm ${th.textSecondary}`}>Vehicle {vehiclePlate} verified</p>
            </div>
            <Button onClick={() => onScanComplete(true)} className="w-full">Continue</Button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <div>
              <h4 className="text-lg font-semibold text-rose-500">Verification Failed</h4>
              <p className={`text-sm ${th.textSecondary}`}>QR code could not be verified. Please try again.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={startScan} className="flex-1">Retry</Button>
              <Button variant="secondary" onClick={() => onScanComplete(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
