import { useState } from "react";
import { Card, Button, Badge, th } from "../ui";
import { ArrowLeft, MapPin, ArrowRight, Calendar, Clock, Car, User, Building, LogIn, LogOut } from "lucide-react";
import type { TransportRequest } from "../../types";

export default function TripDetail({
  trip,
  onBack,
  onCheckIn,
  onCheckOut,
}: {
  trip: TransportRequest;
  onBack: () => void;
  onCheckIn: (vehiclePlate: string, location: string, remark?: string) => void;
  onCheckOut: (vehiclePlate: string, location: string, remark?: string) => void;
}) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [location, setLocation] = useState("");
  const [remark, setRemark] = useState("");

  const handleCheckIn = () => {
    if (!location || !trip.vehiclePlate) return;
    onCheckIn(trip.vehiclePlate, location, remark || undefined);
    setShowCheckIn(false);
    setLocation("");
    setRemark("");
  };

  const handleCheckOut = () => {
    if (!location || !trip.vehiclePlate) return;
    onCheckOut(trip.vehiclePlate, location, remark || undefined);
    setShowCheckOut(false);
    setLocation("");
    setRemark("");
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-amber-500 dark:text-amber-400 text-sm mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <Card className="p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold">{trip.id}</h3>
          <Badge status={trip.status}>{trip.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Passenger</p>
              <p className={th.text}>{trip.passengerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Department</p>
              <p className={th.text}>{trip.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Pickup</p>
              <p className={th.text}>{trip.pickup}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <div>
              <p className={th.textSecondary}>Destination</p>
              <p className={th.text}>{trip.destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Date</p>
              <p className={th.text}>{trip.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Time</p>
              <p className={th.text}>{trip.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-400" />
            <div>
              <p className={th.textSecondary}>Vehicle</p>
              <p className={`${th.text} font-mono`}>{trip.vehiclePlate}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {["ASSIGNED", "QR_PENDING"].includes(trip.status) && (
          <Button onClick={() => setShowCheckIn(true)} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Check In
          </Button>
        )}
        {trip.status === "PICK_UP_SCANNED" && (
          <Button onClick={() => setShowCheckOut(true)} className="w-full" variant="secondary">
            <LogOut className="w-4 h-4 mr-2" />
            Check Out
          </Button>
        )}
      </div>

      {(showCheckIn || showCheckOut) && (
        <Card className="p-4 mt-4">
          <h4 className="font-medium mb-3">{showCheckIn ? "Check In" : "Check Out"}</h4>
          <div className="space-y-3">
            <div>
              <label className={`text-sm ${th.textSecondary}`}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500`}
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className={`text-sm ${th.textSecondary}`}>Remark (optional)</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500`}
                placeholder="Any notes..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={showCheckIn ? handleCheckIn : handleCheckOut} disabled={!location} className="flex-1">
                Submit {showCheckIn ? "Check In" : "Check Out"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowCheckIn(false); setShowCheckOut(false); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
