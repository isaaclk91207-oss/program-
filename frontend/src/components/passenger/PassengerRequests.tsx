import { Card, Badge, EmptyState, th, Icon } from "../ui";
import StatusStepper from "./StatusStepper";
import { Button } from "../ui";
import type { TransportRequest } from "../../types";
import { formatRequestId } from "../../types";

export default function PassengerRequests({
  requests,
  onSelect,
  onBack,
  selectedRequest,
  onPickupScan,
  onDropoffScan,
  onFeedback,
}: {
  requests: TransportRequest[];
  onSelect: (r: TransportRequest | null) => void;
  onBack: () => void;
  selectedRequest: TransportRequest | null;
  onPickupScan: (id: string) => void;
  onDropoffScan: (id: string) => void;
  onFeedback: (r: TransportRequest) => void;
}) {
  if (selectedRequest) {
    return (
      <div>
        <button onClick={() => onSelect(null)} className="flex items-center gap-1 text-role-passenger text-sm mb-3">
          <Icon name="arrow_back" size={16} /> Back
        </button>
        <StatusStepper currentStatus={selectedRequest.status} />
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold">{formatRequestId(selectedRequest.id, selectedRequest.requestNumber)}</h3>
            <Badge status={selectedRequest.status}>{selectedRequest.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Icon name="location_on" size={16} className="text-on-surface-variant" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Pickup</span>
                <span className={th.text}>{selectedRequest.pickup}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="flag" size={16} className="text-emerald-500" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Destination</span>
                <span className={th.text}>{selectedRequest.destination}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="calendar_today" size={16} className="text-on-surface-variant" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Date</span>
                <span className={th.text}>{selectedRequest.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="schedule" size={16} className="text-on-surface-variant" />
              <div className="flex-1 flex justify-between">
                <span className={th.textSecondary}>Time</span>
                <span className={th.text}>{selectedRequest.time}</span>
              </div>
            </div>
            {selectedRequest.driverName && (
              <div className="flex items-center gap-2">
                <Icon name="person" size={16} className="text-on-surface-variant" />
                <div className="flex-1 flex justify-between">
                  <span className={th.textSecondary}>Driver</span>
                  <span className={th.text}>{selectedRequest.driverName}</span>
                </div>
              </div>
            )}
            {selectedRequest.vehiclePlate && (
              <div className="flex items-center gap-2">
                <Icon name="local_shipping" size={16} className="text-on-surface-variant" />
                <div className="flex-1 flex justify-between">
                  <span className={th.textSecondary}>Vehicle</span>
                  <span className={`${th.text} font-mono`}>{selectedRequest.vehiclePlate}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-2">
          {(selectedRequest.status === "QR_PENDING" || selectedRequest.status === "ASSIGNED") && (
            <Button accent="passenger" onClick={() => onPickupScan(selectedRequest.id)} className="w-full">
              <Icon name="qr_code_scanner" size={16} className="mr-2" />
              Scan QR (Pickup)
            </Button>
          )}
          {(selectedRequest.status === "PICK_UP_SCANNED" || selectedRequest.status === "IN_PROGRESS") && (
            <Button variant="secondary" onClick={() => onDropoffScan(selectedRequest.id)} className="w-full">
              <Icon name="qr_code_scanner" size={16} className="mr-2" />
              Scan QR (Dropoff)
            </Button>
          )}
          {selectedRequest.status === "DROP_OFF_SCANNED" && (
            <Button accent="passenger" onClick={() => onFeedback(selectedRequest)} className="w-full">
              <Icon name="rate_review" size={16} className="mr-2" />
              Submit Feedback
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Transport Requests</h2>
      {requests.length === 0 ? (
        <EmptyState message="No transport requests yet" />
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id} className={`p-3 cursor-pointer ${th.borderHover}`} onClick={() => onSelect(r)}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${th.text}`}>{formatRequestId(r.id, r.requestNumber)}</p>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <Icon name="location_on" size={12} />
                    {r.pickup}
                    <Icon name="arrow_forward" size={12} />
                    {r.destination}
                  </div>
                  <p className={`text-xs ${th.textMuted} mt-1`}>{r.date} · {r.time}</p>
                </div>
                <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
