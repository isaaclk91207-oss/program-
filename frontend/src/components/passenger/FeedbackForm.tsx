import { useState } from "react";
import { Button, StarRating, th } from "../ui";
import { X, MessageSquare } from "lucide-react";
import type { TransportRequest } from "../../types";

const TAG_CATEGORIES = {
  negative: [
    { id: "safety", label: "Safety Concerns" },
    { id: "behavior", label: "Driver Behavior" },
    { id: "cleanliness", label: "Vehicle Cleanliness" },
    { id: "service", label: "Service" },
    { id: "punctuality", label: "Punctuality" },
    { id: "other", label: "Other Issues" },
  ],
  positive: [
    { id: "service", label: "Excellent Service" },
    { id: "safety", label: "Felt Safe" },
    { id: "cleanliness", label: "Clean Vehicle" },
    { id: "behavior", label: "Professional Driver" },
    { id: "punctuality", label: "Punctual" },
  ],
};

export default function FeedbackForm({
  request,
  onSubmit,
  onClose,
}: {
  request: TransportRequest;
  onSubmit: (data: { rating: number; comment: string; tags: string[] }) => void;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const availableTags = rating <= 3 ? TAG_CATEGORIES.negative : TAG_CATEGORIES.positive;

  const toggleTag = (tagId: string) => {
    setTags((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim() || tags.length === 0) return;
    onSubmit({ rating, comment: comment.trim(), tags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative ${th.bgCard} border ${th.border} rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Rate Your Ride</h2>
          <button onClick={onClose} className={th.textMuted}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className={`text-xs ${th.textMuted} mb-4`}>{request.id} · {request.driverName} · {request.vehiclePlate}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className={`block text-sm ${th.textSecondary} mb-1`}>Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} h-24 focus:outline-none focus:border-amber-500`}
              placeholder="Share your experience..."
              required
            />
          </div>
          {rating > 0 && (
            <div>
              <label className={`block text-sm ${th.textSecondary} mb-2`}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      tags.includes(tag.id)
                        ? "bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400"
                        : `${th.bgInput} ${th.border} ${th.textSecondary}`
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={rating === 0 || !comment.trim() || tags.length === 0}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
