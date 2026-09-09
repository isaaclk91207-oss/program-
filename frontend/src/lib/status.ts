export type TransportStatus =
  | "PENDING"
  | "ASSIGNED"
  | "QR_PENDING"
  | "PICK_UP_SCANNED"
  | "IN_PROGRESS"
  | "DROP_OFF_SCANNED"
  | "FEEDBACK_SUBMITTED"
  | "COMPLETED";

export type StatusPerspective = "passenger" | "driver" | "admin";

export const statusLabels: Record<TransportStatus, Record<StatusPerspective, string>> = {
  PENDING: {
    passenger: "Requested",
    driver: "Pending",
    admin: "Pending",
  },
  ASSIGNED: {
    passenger: "Driver Assigned",
    driver: "Assigned",
    admin: "Assigned",
  },
  QR_PENDING: {
    passenger: "Waiting for Pickup",
    driver: "Awaiting Pickup",
    admin: "QR Pending",
  },
  PICK_UP_SCANNED: {
    passenger: "Picked Up",
    driver: "Picked Up",
    admin: "Pickup Scanned",
  },
  IN_PROGRESS: {
    passenger: "In Transit",
    driver: "In Transit",
    admin: "In Progress",
  },
  DROP_OFF_SCANNED: {
    passenger: "Dropped Off",
    driver: "Dropped Off",
    admin: "Dropoff Scanned",
  },
  FEEDBACK_SUBMITTED: {
    passenger: "Completed",
    driver: "Completed",
    admin: "Feedback Submitted",
  },
  COMPLETED: {
    passenger: "Completed",
    driver: "Completed",
    admin: "Completed",
  },
};

export const statusColors: Record<TransportStatus, string> = {
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ASSIGNED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  QR_PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PICK_UP_SCANNED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  IN_PROGRESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  DROP_OFF_SCANNED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  FEEDBACK_SUBMITTED: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function getStatusLabel(status: TransportStatus, perspective: StatusPerspective = "passenger"): string {
  return statusLabels[status]?.[perspective] || status;
}

export function getStatusColor(status: TransportStatus): string {
  return statusColors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusProgress(status: TransportStatus): number {
  const order: TransportStatus[] = [
    "PENDING",
    "ASSIGNED",
    "QR_PENDING",
    "PICK_UP_SCANNED",
    "IN_PROGRESS",
    "DROP_OFF_SCANNED",
    "FEEDBACK_SUBMITTED",
    "COMPLETED",
  ];
  const idx = order.indexOf(status);
  return idx >= 0 ? ((idx + 1) / order.length) * 100 : 0;
}

export function isActiveStatus(status: TransportStatus): boolean {
  return ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS"].includes(status);
}

export function isCompletedStatus(status: TransportStatus): boolean {
  return ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED", "COMPLETED"].includes(status);
}