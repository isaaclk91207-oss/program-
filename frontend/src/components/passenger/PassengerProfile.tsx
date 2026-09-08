import { Card, Avatar, th, Icon } from "../ui";
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
      <button onClick={onBack} className="flex items-center gap-1 text-role-passenger text-sm mb-4">
        <Icon name="arrow_back" size={16} /> Back
      </button>
      <Card className="p-4 text-center">
        <Avatar name={user.name} size="lg" className="mx-auto mb-3" />
        <h3 className="font-semibold">{user.name}</h3>
        <div className="flex items-center justify-center gap-1 text-sm text-on-surface-variant mt-1">
          <Icon name="mail" size={14} />
          {user.email}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className={`${th.bgInput} rounded-lg p-3`}>
            <Icon name="receipt_long" size={20} className="text-role-passenger mx-auto mb-1" />
            <p className="text-lg font-bold text-role-passenger">{requests.length}</p>
            <p className={`text-xs ${th.textMuted}`}>Total Requests</p>
          </div>
          <div className={`${th.bgInput} rounded-lg p-3`}>
            <Icon name="check_circle" size={20} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-500">{completed}</p>
            <p className={`text-xs ${th.textMuted}`}>Completed</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
