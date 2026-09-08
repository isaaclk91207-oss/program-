import { useState } from "react";
import { Button, Input, Modal, Icon } from "../ui";

export default function VehicleForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { plate: string; make: string; model: string; year: number; color: string }) => void;
}) {
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!plate.trim()) errs.plate = "Plate number is required";
    if (!make.trim()) errs.make = "Make is required";
    if (!model.trim()) errs.model = "Model is required";
    if (!color.trim()) errs.color = "Color is required";
    if (year < 2000 || year > new Date().getFullYear() + 1) errs.year = "Invalid year";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ plate: plate.trim().toUpperCase(), make: make.trim(), model: model.trim(), year, color: color.trim() });
    setPlate("");
    setMake("");
    setModel("");
    setYear(new Date().getFullYear());
    setColor("");
    setErrors({});
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Vehicle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plate Number"
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="e.g. 1A-1234"
          error={errors.plate}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="e.g. Toyota"
            error={errors.make}
            required
          />
          <Input
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Corolla"
            error={errors.model}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={new Date().getFullYear() + 1}
            error={errors.year}
            required
          />
          <Input
            label="Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. White"
            error={errors.color}
            required
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" accent="admin" className="flex-1">
            <Icon name="directions_car" size={16} className="mr-2" />
            Create Vehicle
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
