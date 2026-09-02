import { Card, Avatar, th } from "../ui";
import { ArrowLeft, Mail, ClipboardList, Calendar, Star } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function PassengerProfile({
  user,
  requests,
  onBack,
}: {
  user: { name: string; email: string };
  requests: TransportRequest[];
  onBack: () => void;
}) {
  const completed = requests.filter((r) => r.status === "FEEDBACK_SUBMITTED").length;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <Card className="p-4 text-center">
        <Avatar name={user.name} size="lg" className="mx-auto mb-3" />
        <h3 className="font-semibold">{user.name}</h3>
        <div className="flex items-center justify-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
          <Mail className="w-3 h-3" />
          {user.email}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className={`${th.bgInput} rounded-lg p-3`}>
            <ClipboardList className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-500 dark:text-amber-400">{requests.length}</p>
            <p className={`text-xs ${th.textMuted}`}>Total Requests</p>
          </div>
          <div className={`${th.bgInput} rounded-lg p-3`}>
            <Star className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400">{completed}</p>
            <p className={`text-xs ${th.textMuted}`}>Completed</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
