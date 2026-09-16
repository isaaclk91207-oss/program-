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
        
        {/* Trip Details Card */}
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-title-md text-title-md font-semibold">{formatRequestId(selectedRequest.id, selectedRequest.requestNumber)}</h3>
            <Badge status={selectedRequest.status}>{selectedRequest.status.replace(/_/g, " ")}</Badge>
          </div>
          
          {/* Route visualization */}
          <div className="bg-surface-container-low dark:bg-navy-800 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-4">
              {/* Pickup */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Icon name="circle" size={12} className="text-white" fill />
                </div>
                <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-xs text-on-surface-variant dark:text-outline-variant mb-1">PICKUP</p>
                <p className={`font-medium ${th.text}`}>{selectedRequest.pickup}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              {/* Destination */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-role-passenger rounded-full flex items-center justify-center">
                  <Icon name="flag" size={14} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-on-surface-variant dark:text-outline-variant mb-1">DESTINATION</p>
                <p className={`font-medium ${th.text}`}>{selectedRequest.destination}</p>
              </div>
            </div>
          </div>
          
          {/* Trip details grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface-container-low dark:bg-navy-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="calendar_today" size={14} className="text-role-passenger" />
                <span className="text-xs text-on-surface-variant dark:text-outline-variant">Date</span>
              </div>
              <p className={`font-medium ${th.text}`}>{selectedRequest.date}</p>
            </div>
            <div className="bg-surface-container-low dark:bg-navy-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="schedule" size={14} className="text-role-passenger" />
                <span className="text-xs text-on-surface-variant dark:text-outline-variant">Time</span>
              </div>
              <p className={`font-medium ${th.text}`}>{selectedRequest.time}</p>
            </div>
          </div>
          
          {/* Driver & Vehicle info */}
          {(selectedRequest.driverName || selectedRequest.vehiclePlate) && (
            <div className="border-t border-border-hairline dark:border-outline-variant pt-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedRequest.driverName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-role-driver-container rounded-full flex items-center justify-center">
                      <Icon name="person" size={18} className="text-role-driver" />
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant dark:text-outline-variant">Driver</p>
                      <p className={`font-medium ${th.text}`}>{selectedRequest.driverName}</p>
                    </div>
                  </div>
                )}
                {selectedRequest.vehiclePlate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-role-driver-container rounded-full flex items-center justify-center">
                      <Icon name="local_shipping" size={18} className="text-role-driver" />
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant dark:text-outline-variant">Vehicle</p>
                      <p className={`font-mono font-medium ${th.text}`}>{selectedRequest.vehiclePlate}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
        
        {/* Action buttons */}
        <div className="space-y-3">
          {(selectedRequest.status === "QR_PENDING" || selectedRequest.status === "ASSIGNED") && (
            <Button accent="passenger" onClick={() => onPickupScan(selectedRequest.id)} className="w-full py-3">
              <Icon name="qr_code_scanner" size={20} className="mr-2" />
              Scan QR (Pickup)
            </Button>
          )}
          {(selectedRequest.status === "PICK_UP_SCANNED" || selectedRequest.status === "IN_PROGRESS") && (
            <Button variant="secondary" onClick={() => onDropoffScan(selectedRequest.id)} className="w-full py-3">
              <Icon name="qr_code_scanner" size={20} className="mr-2" />
              Scan QR (Dropoff)
            </Button>
          )}
          {selectedRequest.status === "DROP_OFF_SCANNED" && (
            <Button accent="passenger" onClick={() => onFeedback(selectedRequest)} className="w-full py-3">
              <Icon name="rate_review" size={20} className="mr-2" />
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
            <Card key={r.id} className={`p-4 cursor-pointer ${th.borderHover}`} onClick={() => onSelect(r)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className={`text-sm font-medium ${th.text}`}>{formatRequestId(r.id, r.requestNumber)}</p>
                  <p className={`text-xs ${th.textMuted} mt-1`}>{r.date} · {r.time}</p>
                </div>
                <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
              </div>
              
              {/* Route summary */}
              <div className="flex items-center gap-2 text-sm">
                <Icon name="circle" size={8} className="text-emerald-500" fill />
                <span className={th.text}>{r.pickup}</span>
                <Icon name="arrow_forward" size={14} className="text-on-surface-variant" />
                <Icon name="flag" size={8} className="text-role-passenger" />
                <span className={th.text}>{r.destination}</span>
              </div>
              
              {/* Driver info if available */}
              {r.driverName && (
                <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
                  <Icon name="person" size={12} />
                  <span>{r.driverName}</span>
                  {r.vehiclePlate && (
                    <>
                      <span className="text-on-surface-variant">·</span>
                      <Icon name="local_shipping" size={12} />
                      <span className="font-mono">{r.vehiclePlate}</span>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
