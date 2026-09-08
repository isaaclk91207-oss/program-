import { useState } from "react";
import { Button, Input, Modal, th } from "../ui";
import { UserPlus } from "lucide-react";

export default function DriverForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; password: string; name: string; phone?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setErrors({});
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Driver">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ko Htet Aung Zaw"
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="driver@pccp.demo"
          error={errors.email}
          required
        />
        <Input
          label="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+95 9 123 456 789"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          error={errors.password}
          required
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Driver
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
