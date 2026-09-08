import { useState, useEffect } from "react";
import { Button, Icon } from "../ui";
import { QRCodeSVG } from "qrcode.react";

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
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1 font-title-md text-title-md text-role-driver dark:text-purple-400 mb-4 hover:underline"
      >
        <Icon name="arrow_back" size={18} /> Back
      </button>

      <div className="bg-surface dark:bg-navy-900 rounded-2xl border border-border-hairline dark:border-outline-variant p-6 text-center">
        <div className="mb-4">
          <span className="w-12 h-12 rounded-2xl bg-role-driver-container dark:bg-purple-500/20 text-role-driver dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
            <Icon name="qr_code_scanner" size={28} />
          </span>
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-white">QR Verification</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
            Verify vehicle: <span className="font-mono">{vehiclePlate}</span>
          </p>
        </div>

        {state === "idle" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 inline-block border border-border-hairline">
              <QRCodeSVG value={vehiclePlate} size={160} level="M" />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">
              Show this QR code to the passenger, or scan the passenger&apos;s QR code
            </p>
            <Button accent="driver" onClick={startScan} className="w-full">
              <Icon name="qr_code_scanner" size={18} className="mr-2" />
              Start Scanning
            </Button>
          </div>
        )}

        {state === "scanning" && (
          <div className="space-y-4">
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 rounded-2xl border-4 border-role-driver/60 dark:border-purple-400/60" />
              <div className="absolute inset-x-4 h-1 rounded-full bg-role-driver/70 dark:bg-purple-400/70 animate-pulse" />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant">Scanning QR code...</p>
            <div className="w-full bg-surface-container-low dark:bg-navy-900 rounded-full h-2 border border-border-hairline dark:border-outline-variant">
              <div className="bg-role-driver dark:bg-purple-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <span className="w-16 h-16 rounded-full bg-role-admin-container dark:bg-emerald-500/20 text-role-admin dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Icon name="check_circle" size={40} />
            </span>
            <div>
              <h4 className="font-title-lg text-title-lg font-bold text-role-admin dark:text-emerald-400">
                Verification Successful
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
                Vehicle {vehiclePlate} verified
              </p>
            </div>
            <Button accent="driver" onClick={() => onScanComplete(true)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <span className="w-16 h-16 rounded-full bg-error-container dark:bg-rose-500/20 text-error dark:text-rose-400 flex items-center justify-center mx-auto">
              <Icon name="cancel" size={40} />
            </span>
            <div>
              <h4 className="font-title-lg text-title-lg font-bold text-error dark:text-rose-400">Verification Failed</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
                QR code could not be verified. Please try again.
              </p>
            </div>
            <div className="flex gap-3">
              <Button accent="driver" onClick={startScan} className="flex-1">
                Retry
              </Button>
              <Button variant="secondary" onClick={() => onScanComplete(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}