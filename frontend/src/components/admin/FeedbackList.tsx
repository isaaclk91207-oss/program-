import { Card, Button, StarRating, th, Icon } from "../ui";
import type { Feedback } from "../../types";
import { formatRequestId } from "../../types";

export default function FeedbackList({
  feedbacks,
  onExport,
}: {
  feedbacks: Feedback[];
  onExport: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Feedback</h2>
        <Button variant="secondary" size="sm" onClick={onExport}>
          <Icon name="download" size={16} className="mr-1" />
          Export
        </Button>
      </div>
      <div className="space-y-2">
        {feedbacks.map((f) => (
          <Card key={f.id} className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={`text-sm font-medium ${th.text}`}>{f.passengerName} → {f.driverName}</p>
                <p className={`text-xs ${th.textMuted}`}>{f.vehiclePlate} · {formatRequestId(f.requestId)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Icon name="chat" size={12} className="text-slate-400" />
                  <p className={`text-xs ${th.textSecondary}`}>{f.comment}</p>
                </div>
                <div className="flex gap-1 mt-2">
                  {f.tags.map((t) => (
                    <span key={t} className={`text-xs ${th.bgInput} px-2 py-0.5 rounded ${th.textSecondary}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center gap-1">
                  <Icon name="star" size={16} className="text-emerald-400 fill-emerald-400" />
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{f.rating}</p>
                </div>
                <p className={`text-xs ${th.textMuted}`}>{f.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
