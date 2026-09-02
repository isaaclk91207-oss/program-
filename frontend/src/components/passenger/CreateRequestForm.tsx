import { useState } from "react";
import { Button, Input, Select, th } from "../ui";
import { MapPin, Calendar, Clock, Building } from "lucide-react";

const DEPARTMENTS = ["Executive", "Finance", "HR", "Operations", "Marketing", "IT", "Legal"];
const DESTINATIONS = ["Yangon International Airport", "Downtown", "Junction City", "Sule", "Yangon Central Station", "Head Office"];

export default function CreateRequestForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { department: string; pickup: string; destination: string; date: string; time: string }) => void;
  onCancel: () => void;
}) {
  const [department, setDepartment] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ department, pickup, destination, date, time });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">New Transport Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          options={[
            { value: "", label: "Select department" },
            ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
          ]}
          required
        />
        <div>
          <label className={`block text-sm ${th.textSecondary} mb-1`}>Pickup Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              list="locations"
              className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500`}
              required
            />
          </div>
        </div>
        <div>
          <label className={`block text-sm ${th.textSecondary} mb-1`}>Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              list="locations"
              className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-amber-500`}
              required
            />
          </div>
          <datalist id="locations">
            {DESTINATIONS.map((d) => <option key={d} value={d} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">Submit Request</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
