import { Card, Button, StarRating, th } from "../ui";
import { Download, Star, MessageSquare } from "lucide-react";
import type { Feedback } from "../../types";

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
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>
      <div className="space-y-2">
        {feedbacks.map((f) => (
          <Card key={f.id} className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={`text-sm font-medium ${th.text}`}>{f.passengerName} → {f.driverName}</p>
                <p className={`text-xs ${th.textMuted}`}>{f.vehiclePlate} · {f.requestId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
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
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <p className="text-lg font-bold text-amber-500 dark:text-amber-400">{f.rating}</p>
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
