import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { th } from "./ui";

export default function NotFoundPage() {
  return (
    <div className={`min-h-screen ${th.bg} flex items-center justify-center p-8`}>
      <div className={`${th.bgCard} border ${th.border} rounded-xl p-8 max-w-md text-center`}>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">404 — Page Not Found</h2>
        <p className={`text-sm ${th.textSecondary} mb-6`}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-medium rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
