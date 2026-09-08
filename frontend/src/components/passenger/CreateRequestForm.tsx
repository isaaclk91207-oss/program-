import { useState } from "react";
import { Button, Input, Select, th, Icon } from "../ui";

const DEPARTMENTS = ["Executive", "Operations", "Internal Audit", "Group Finance", "HR", "Marketing", "IT", "Legal"];
const SECTIONS = ["General", "Dispatch", "Field Operations", "Branch Office"];
const SERVICE_TYPES = ["Round Trip", "One Way", "Branch Patrol", "Airport Transfer", "Executive Transport", "Other"];
const DESTINATIONS = ["Yangon International Airport", "Downtown", "Junction City", "Sule", "Yangon Central Station", "Head Office"];

export default function CreateRequestForm({
  user,
  onSubmit,
  onCancel,
}: {
  user: { name: string };
  onSubmit: (data: { department: string; pickup: string; destination: string; date: string; time: string }) => void;
  onCancel: () => void;
}) {
  const [wayUsers, setWayUsers] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [noOfPeople, setNoOfPeople] = useState(1);
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ department, pickup, destination, date, time });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon name="drive_file_rename_outline" size={20} className="text-role-passenger" />
        <h2 className="text-lg font-semibold">Vehicle Transport Request Form</h2>
      </div>
      <p className={`text-xs ${th.textMuted} mb-4`}>Fill in the details below. Required fields are marked.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Person (auto-filled) */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Request Person"
            value={user.name}
            readOnly
            className="opacity-90"
          />
          <Input
            label="No. of People"
            type="number"
            min={1}
            value={noOfPeople}
            onChange={(e) => setNoOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="1"
          />
        </div>

        <Input
          label="Way Users (comma-separated)"
          value={wayUsers}
          onChange={(e) => setWayUsers(e.target.value)}
          placeholder="e.g. Daw Thin Thin, U Aung"
          helpText="List all passengers travelling together"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[{ value: "", label: "Select department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
            required
          />
          <Select
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            options={[{ value: "", label: "Select section" }, ...SECTIONS.map((s) => ({ value: s, label: s }))]}
          />
        </div>

        <Select
          label="Type of Service"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          options={[{ value: "", label: "Select service type" }, ...SERVICE_TYPES.map((s) => ({ value: s, label: s }))]}
        />

        <div>
          <label className={`block text-sm ${th.textSecondary} mb-1`}>Purpose of Travel</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} h-20 focus:outline-none focus:border-role-passenger`}
            placeholder="State the purpose, including customer / site names"
          />
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm ${th.textSecondary} mb-1`}>Pickup / From</label>
            <div className="relative">
              <Icon name="location_on" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} list="locations" className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-role-passenger`} required />
            </div>
          </div>
          <div>
            <label className={`block text-sm ${th.textSecondary} mb-1`}>Destination / To</label>
            <div className="relative">
              <Icon name="flag" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} list="locations" className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-role-passenger`} required />
            </div>
          </div>
          <datalist id="locations">
            {DESTINATIONS.map((d) => <option key={d} value={d} />)}
          </datalist>
        </div>

        {/* Travel date & times */}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Travel Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input
            label="Departure Time (From)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <Input
            label="Return Time (To)"
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
          />
        </div>

        <div>
          <label className={`block text-sm ${th.textSecondary} mb-1`}>Note to Transport</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} h-16 focus:outline-none focus:border-role-passenger`}
            placeholder="Duration, special requirements or instructions"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" accent="passenger">Submit Request</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
