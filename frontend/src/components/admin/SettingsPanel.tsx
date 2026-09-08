import { useState } from "react";
import { Card, Button, ProgressBar, th, Icon } from "../ui";

export default function SettingsPanel({
  settings,
  onSave,
}: {
  settings: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [weights, setWeights] = useState({
    writtenWeight: (settings.writtenWeight as number) || 0.2,
    practicalWeight: (settings.practicalWeight as number) || 0.3,
    operationalWeight: (settings.operationalWeight as number) || 0.3,
    feedbackWeight: (settings.feedbackWeight as number) || 0.2,
  });

  const totalWeight = weights.writtenWeight + weights.practicalWeight + weights.operationalWeight + weights.feedbackWeight;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Scoring Weights</h3>
        <div className="space-y-4">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-sm ${th.textSecondary}`}>
                  {key.replace("Weight", "").replace(/([A-Z])/g, " $1")}
                </label>
                <span className={`text-sm font-mono ${th.text}`}>{(value * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <ProgressBar
            value={totalWeight * 100}
            color={Math.abs(totalWeight - 1) < 0.01 ? "emerald" : "amber"}
          />
          <p className={`text-sm mt-2 ${Math.abs(totalWeight - 1) < 0.01 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            Total: {(totalWeight * 100).toFixed(0)}% {Math.abs(totalWeight - 1) < 0.01 ? "✓ Valid" : "(should be 100%)"}
          </p>
        </div>
      </Card>
      <div className="flex gap-3">
        <Button onClick={() => onSave(weights)} accent="admin">
          <Icon name="save" size={16} className="mr-2" />
          Save Settings
        </Button>
        <Button variant="ghost" onClick={() => setWeights({
          writtenWeight: 0.2,
          practicalWeight: 0.3,
          operationalWeight: 0.3,
          feedbackWeight: 0.2,
        })}>
          <Icon name="refresh" size={16} className="mr-2" />
          Reset Defaults
        </Button>
      </div>
    </div>
  );
}
