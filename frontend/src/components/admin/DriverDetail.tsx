import { useState, useEffect } from "react";
import { Card, Button, Badge, CertBadge, ProgressBar, Tabs, th, ConfirmDialog, StarRating, Icon, HoursCard } from "../ui";
import PassportCard from "../driver/PassportCard";
import { getDriverFeedback, getDrivingHours, getDriverTasks, createDriverTask, updateDriverTask, deleteDriverTask, adminCheckIn, adminCheckOut } from "../../services/api";
import { onTripStatusChanged } from "../../services/socket";
import type { Driver, Feedback, Assessment, TripHoursEntry, DriverTask, Vehicle } from "../../types";

function getDisplayId(d: Driver): string {
  if (d.version === "v2" && d.employeeId) return d.employeeId;
  if (d.id.startsWith("DRV-")) return d.id;
  return d.id.substring(0, 8);
}

const PRACTICAL_CRITERIA = ["preTripReadiness", "vehicleInspection", "safety", "behavior", "serviceDelivery"];
const OPERATIONAL_CRITERIA = ["accidentRecord", "vehicleDamage", "attendance", "documentation", "vehicleUtilization"];

const PASS_MARKS: Record<string, number> = { CD: 75, CC: 80, CPC: 85, CEC: 88, CMC: 90 };

export default function DriverDetail({
  driver,
  vehicles,
  onBack,
  onUpdateAssessment,
  onUpdateDriver,
  onDeleteDriver,
  onIssueCert,
  onRevokeCert,
  onSuspendDriver,
  onUnsuspendDriver,
}: {
  driver: Driver;
  vehicles: Vehicle[];
  onBack: () => void;
  onUpdateAssessment: (data: { written: number; practical: Record<string, number>; operational: Record<string, number> }) => void;
  onUpdateDriver: (data: Record<string, unknown>) => void;
  onDeleteDriver: () => void;
  onIssueCert: (level: string, validUntil: string) => void;
  onRevokeCert: (reason: string) => void;
  onSuspendDriver: (reason: string) => void;
  onUnsuspendDriver: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [drivingHours, setDrivingHours] = useState<{ tripHours: number; tripCount: number; drivingHours: number; waitingTimeMs: number; taskHours: number; trips: TripHoursEntry[] } | null>(null);

  // Task state
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDurationHours, setTaskDurationHours] = useState("");
  const [taskVehicleId, setTaskVehicleId] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Admin Check-in/out state
  const [activeCheckin, setActiveCheckin] = useState({
    active: !!driver.hasActiveCheckin,
    plate: driver.activeCheckinVehiclePlate || "",
    time: driver.activeCheckinTime || null,
    location: driver.activeCheckinLocation || null,
  });
  const [checkInVehicleId, setCheckInVehicleId] = useState("");
  const [checkInLocation, setCheckInLocation] = useState("");
  const [checkInRemark, setCheckInRemark] = useState("");
  const [checkOutVehicleId, setCheckOutVehicleId] = useState("");
  const [checkOutLocation, setCheckOutLocation] = useState("");
  const [checkOutRemark, setCheckOutRemark] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkError, setCheckError] = useState("");

  // Assessment state
  const [written, setWritten] = useState(80);
  const [practical, setPractical] = useState<Record<string, number>>({
    preTripReadiness: 80, vehicleInspection: 80, safety: 80, behavior: 80, serviceDelivery: 80,
  });
  const [operational, setOperational] = useState<Record<string, number>>({
    accidentRecord: 80, vehicleDamage: 80, attendance: 80, documentation: 80, vehicleUtilization: 80,
  });

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmCertLevel, setConfirmCertLevel] = useState("CC");

  useEffect(() => {
    if (tab === "feedback") loadFeedback();
    if (tab === "tasks") loadTasks();
  }, [tab]);

  function loadHours() {
    getDrivingHours(driver.id).then((data) => {
      if (data.length > 0) setDrivingHours(data[0]);
    }).catch(() => {});
  }

  useEffect(() => { loadHours(); }, [driver.id]);

  useEffect(() => {
    setActiveCheckin({
      active: !!driver.hasActiveCheckin,
      plate: driver.activeCheckinVehiclePlate || "",
      time: driver.activeCheckinTime || null,
      location: driver.activeCheckinLocation || null,
    });
    // Pre-select the driver's assigned vehicle for check-in
    if (driver.currentVehicleId) setCheckInVehicleId(driver.currentVehicleId);
    if (driver.hasActiveCheckin && driver.activeCheckinVehiclePlate) {
      const v = vehicles.find((x) => x.plate === driver.activeCheckinVehiclePlate);
      if (v) setCheckOutVehicleId(v.id);
    }
  }, [driver.id]);

  useEffect(() => {
    const unsub = onTripStatusChanged((event) => {
      if (event.driverId === driver.id) loadHours();
    });
    return unsub;
  }, [driver.id]);

  async function loadFeedback() {
    setLoadingFeedback(true);
    try {
      const data = await getDriverFeedback(driver.id);
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  }

  function loadTasks() {
    getDriverTasks(driver.id).then((data) => {
      setTasks(data);
    }).catch(() => {});
  }

  async function handleAdminCheckIn() {
    if (!checkInVehicleId || !checkInLocation) return;
    setCheckingIn(true);
    setCheckError("");
    try {
      const plate = vehicles.find(v => v.id === checkInVehicleId)?.plate || "";
      await adminCheckIn({
        driverId: driver.id,
        vehiclePlate: plate,
        location: checkInLocation,
        remark: checkInRemark || undefined,
      });
      setCheckInVehicleId("");
      setCheckInLocation("");
      setCheckInRemark("");
      setActiveCheckin({ active: true, plate, time: new Date().toISOString(), location: checkInLocation });
      loadHours();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      setCheckError(data?.error?.message || data?.message || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleAdminCheckOut() {
    if (!checkOutVehicleId || !checkOutLocation) return;
    setCheckingOut(true);
    setCheckError("");
    try {
      const plate = vehicles.find(v => v.id === checkOutVehicleId)?.plate || "";
      await adminCheckOut({
        driverId: driver.id,
        vehiclePlate: plate,
        location: checkOutLocation,
        remark: checkOutRemark || undefined,
      });
      setCheckOutVehicleId("");
      setCheckOutLocation("");
      setCheckOutRemark("");
      setActiveCheckin((prev) => ({ ...prev, active: false }));
      loadHours();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      setCheckError(data?.error?.message || data?.message || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleCreateTask() {
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    try {
      const durationMs = taskDurationHours ? Math.round(parseFloat(taskDurationHours) * 3600000) : undefined;
      await createDriverTask(driver.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        vehicleId: taskVehicleId || undefined,
        estimatedDurationMs: durationMs,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDurationHours("");
      setTaskVehicleId("");
      loadTasks();
      loadHours();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await updateDriverTask(driver.id, taskId, { status: "COMPLETED" });
      loadTasks();
      loadHours();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteTask() {
    if (!deletingTaskId) return;
    try {
      await deleteDriverTask(driver.id, deletingTaskId);
      setDeletingTaskId(null);
      loadTasks();
      loadHours();
    } catch (err) {
      console.error(err);
    }
  }

  // Compute assessment scores
  const practicalScore = PRACTICAL_CRITERIA.reduce((sum, c) => sum + (practical[c] || 0) * (c === "safety" ? 0.3 : c === "preTripReadiness" || c === "vehicleInspection" ? 0.2 : 0.15), 0);
  const operationalScore = OPERATIONAL_CRITERIA.reduce((sum, c) => sum + (operational[c] || 0) * (c === "vehicleUtilization" ? 0.3 : c === "documentation" ? 0.1 : 0.2), 0);
  const feedback100 = (driver.rating || 0) * 20;
  const overallScore = Math.round((written * 0.2 + practicalScore * 0.3 + operationalScore * 0.3 + feedback100 * 0.2) * 100) / 100;

  const qualifiesFor = Object.entries(PASS_MARKS)
    .filter(([, threshold]) => overallScore >= threshold)
    .map(([level]) => level);

  const tabItems = [
    { key: "overview", label: "Overview", icon: <Icon name="shield" size={16} /> },
    { key: "info", label: "Info", icon: <Icon name="settings" size={16} /> },
    { key: "passport", label: "Passport", icon: <Icon name="credit_card" size={16} /> },
    { key: "assessment", label: "Assessment", icon: <Icon name="trending_up" size={16} /> },
    { key: "feedback", label: "Feedback", icon: <Icon name="chat" size={16} /> },
    { key: "tasks", label: "Tasks", icon: <Icon name="assignment" size={16} /> },
    { key: "records", label: "Records", icon: <Icon name="history" size={16} /> },
  ];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-role-admin dark:text-emerald-400 text-sm mb-3">
        <Icon name="arrow_back" size={16} /> Back to drivers
      </button>

      {/* Header Card */}
      <Card className="p-4 mb-4 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-navy-900 border-slate-700">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-400">
                {(driver.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{driver.name}</h3>
              <p className="text-sm text-slate-400 font-mono">{getDisplayId(driver)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CertBadge level={driver.certLevel} />
            <Badge status={driver.certStatus}>{driver.certStatus}</Badge>
            <Badge status={driver.status}>{driver.status}</Badge>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabItems} active={tab} onChange={setTab} />

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={th.textSecondary}>Score</p>
                <p className="text-xl font-bold text-role-admin dark:text-emerald-400">{driver.score}</p>
              </div>
              <div>
                <p className={th.textSecondary}>Rating</p>
                <div className="flex items-center gap-1">
                  <Icon name="star" size={20} />
                  <p className="text-xl font-bold text-role-admin dark:text-emerald-400">{driver.rating}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="phone" size={16} />
                <div>
                  <p className={th.textSecondary}>Phone</p>
                  <p className={th.text}>{driver.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="mail" size={16} />
                <div>
                  <p className={th.textSecondary}>Email</p>
                  <p className={th.text}>{driver.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="directions_car" size={16} />
                <div>
                  <p className={th.textSecondary}>Vehicle</p>
                  <p className={`${th.text} font-mono`}>{driver.currentVehiclePlate || "—"}</p>
                </div>
              </div>
              <div>
                <p className={th.textSecondary}>Status</p>
                <p className={th.text}>{driver.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="calendar_today" size={16} />
                <div>
                  <p className={th.textSecondary}>Joined</p>
                  <p className={th.text}>{driver.joinedDate}</p>
                </div>
              </div>
              <div>
                <p className={th.textSecondary}>Accident Free</p>
                <p className={th.text}>{driver.accidentFree || "—"}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <HoursCard type="trip" value={drivingHours ? `${drivingHours.tripHours}h (${drivingHours.tripCount} trips)` : "—"} showDescription={false} />
                <HoursCard type="driving" value={drivingHours ? `${drivingHours.drivingHours}h` : "—"} showDescription={false} />
                <HoursCard type="waiting" value={drivingHours ? `${Math.round((drivingHours.waitingTimeMs || 0) / 3600000 * 10) / 10}h` : "—"} showDescription={false} />
                <HoursCard type="task" value={drivingHours ? `${drivingHours.taskHours || 0}h` : "—"} showDescription={false} />
              </div>

              {drivingHours && drivingHours.trips.length > 0 && (
                <div className="col-span-2 mt-2">
                  <p className={`${th.textSecondary} mb-2`}>Trip Breakdown</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {drivingHours.trips.map((t) => (
                      <div key={t.requestId} className="flex justify-between items-center py-1 text-xs border-b border-border-hairline dark:border-outline-variant last:border-0">
                        <div>
                          <span className={`${th.text}`}>{t.route || t.requestId}</span>
                          <span className={`${th.textSecondary} ml-2`}>{t.tripDate}</span>
                        </div>
                        <div className="flex gap-2">
                          {t.tripHours > 0 && <span className="text-blue-500">{t.tripHours}h</span>}
                          {t.drivingHours > 0 && <span className="text-emerald-500">{t.drivingHours}h</span>}
                          {t.waitingTimeMs > 0 && <span className="text-amber-500">{Math.round((t.waitingTimeMs / 3600000) * 10) / 10}h wait</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </Card>

          {/* Cert Actions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Certificate Actions</h3>
            <div className="flex flex-wrap gap-2">
              {driver.certStatus !== "CERTIFIED" && (
                <Button accent="admin" size="sm" onClick={() => setConfirmAction("issue")}>
                  <Icon name="check_circle" size={16} /> Issue Certificate
                </Button>
              )}
              {driver.certStatus === "CERTIFIED" && (
                <Button size="sm" variant="danger" onClick={() => setConfirmAction("revoke")}>
                  <Icon name="cancel" size={16} /> Revoke Certificate
                </Button>
              )}
              {driver.status !== "Suspended" ? (
                <Button size="sm" variant="ghost" onClick={() => setConfirmAction("suspend")}>
                  <Icon name="warning" size={16} /> Suspend Driver
                </Button>
              ) : (
                <Button accent="admin" size="sm" onClick={() => onUnsuspendDriver()}>
                  <Icon name="check_circle" size={16} /> Unsuspend Driver
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setConfirmAction("delete")}>
                <Icon name="cancel" size={16} /> Delete Driver
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Info Tab */}
      {tab === "info" && (
        <Card className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>Cert Level</span>
            <CertBadge level={driver.certLevel} />
          </div>
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>Cert Status</span>
            <Badge status={driver.certStatus}>{driver.certStatus}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>Valid Until</span>
            <span className={th.text}>{driver.validUntil || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>English Level</span>
            <span className={th.text}>{driver.englishLevel || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>Credits</span>
            <span className={th.text}>{driver.credits}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={th.textSecondary}>Driver Status</span>
            <Badge status={driver.status}>{driver.status}</Badge>
          </div>
        </Card>
      )}

      {/* Passport Tab */}
      {tab === "passport" && <PassportCard driver={driver} className="max-w-4xl" wide />}

      {/* Assessment Tab */}
      {tab === "assessment" && (
        <Card className="p-4 space-y-4">
          <div>
            <label className={`text-sm ${th.textSecondary}`}>Written Score</label>
            <input
              type="number" min={0} max={100} value={written}
              onChange={(e) => setWritten(Number(e.target.value))}
              className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-role-admin`}
            />
            <ProgressBar value={written} color="emerald" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${th.textSecondary}`}>Practical Scores</p>
              <span className={`text-sm font-mono ${th.text}`}>{practicalScore.toFixed(1)} / 100</span>
            </div>
            {PRACTICAL_CRITERIA.map((c) => (
              <div key={c} className="flex items-center gap-3 mb-2">
                <label className={`text-xs ${th.textMuted} w-40`}>{c.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="number" min={0} max={100} value={practical[c]}
                  onChange={(e) => setPractical({ ...practical, [c]: Number(e.target.value) })}
                  className={`w-20 px-2 py-1 text-sm rounded border ${th.bgInput} ${th.border} ${th.text}`}
                />
                <div className="flex-1"><ProgressBar value={practical[c]} color="blue" /></div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${th.textSecondary}`}>Operational Scores</p>
              <span className={`text-sm font-mono ${th.text}`}>{operationalScore.toFixed(1)} / 100</span>
            </div>
            {OPERATIONAL_CRITERIA.map((c) => (
              <div key={c} className="flex items-center gap-3 mb-2">
                <label className={`text-xs ${th.textMuted} w-40`}>{c.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="number" min={0} max={100} value={operational[c]}
                  onChange={(e) => setOperational({ ...operational, [c]: Number(e.target.value) })}
                  className={`w-20 px-2 py-1 text-sm rounded border ${th.bgInput} ${th.border} ${th.text}`}
                />
                <div className="flex-1"><ProgressBar value={operational[c]} color="emerald" /></div>
              </div>
            ))}
          </div>

          {/* Score Summary */}
          <div className={`${th.bgInput} rounded-lg p-4 space-y-2`}>
            <div className="flex justify-between text-sm">
              <span className={th.textSecondary}>Written (20%)</span>
              <span className={th.text}>{(written * 0.2).toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={th.textSecondary}>Practical (30%)</span>
              <span className={th.text}>{(practicalScore * 0.3).toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={th.textSecondary}>Operational (30%)</span>
              <span className={th.text}>{(operationalScore * 0.3).toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={th.textSecondary}>Feedback (20%)</span>
              <span className={th.text}>{(feedback100 * 0.2).toFixed(1)}</span>
            </div>
            <div className={`border-t ${th.border} pt-2 flex justify-between font-bold`}>
              <span>Overall Score</span>
              <span className="text-role-admin dark:text-emerald-400">{overallScore}</span>
            </div>
          </div>

          {/* Qualifies For */}
          <div className={`${th.bgInput} rounded-lg p-4`}>
            <p className={`text-sm ${th.textSecondary} mb-2`}>Qualifies For</p>
            <div className="flex gap-2">
              {qualifiesFor.length > 0 ? (
                qualifiesFor.map((level) => (
                  <CertBadge key={level} level={level} />
                ))
              ) : (
                <span className={`text-sm ${th.textMuted}`}>Does not meet any certification level</span>
              )}
            </div>
          </div>

          <Button accent="admin" onClick={() => onUpdateAssessment({ written, practical, operational })}>
            Save Assessment
          </Button>
        </Card>
      )}

      {/* Feedback Tab */}
      {tab === "feedback" && (
        <div className="space-y-2">
          {loadingFeedback ? (
            <div className="flex justify-center py-8"><Icon name="progress_activity" size={24} /></div>
          ) : feedbacks.length === 0 ? (
            <Card className="p-8 text-center"><p className={th.textSecondary}>No feedback yet</p></Card>
          ) : (
            feedbacks.map((f) => (
              <Card key={f.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${th.text}`}>{f.passengerName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating value={f.rating} readonly size="sm" />
                    </div>
                    <p className={`text-xs ${th.textSecondary} mt-1`}>{f.comment}</p>
                    <div className="flex gap-1 mt-1">
                      {f.tags.map((t) => (
                        <span key={t} className={`text-xs ${th.bgInput} px-2 py-0.5 rounded ${th.textSecondary}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs ${th.textMuted}`}>{f.date}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          {/* Admin Check-in/Out — required after a driver is assigned */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon name="fact_check" size={18} />
                </span>
                <div>
                  <h4 className={`font-semibold ${th.text}`}>Driver Check-In / Check-Out</h4>
                  <p className={`text-xs ${th.textMuted}`}>Required after assignment — starts / ends driving hours.</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  activeCheckin.active
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeCheckin.active ? "bg-white" : "bg-amber-500"}`} />
                {activeCheckin.active ? "Checked In" : "Not Checked In"}
              </span>
            </div>

            {/* Status banner */}
            <div
              className={`flex items-start gap-2.5 p-3 rounded-lg border mb-4 ${
                activeCheckin.active
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                  : "bg-surface-container-low dark:bg-navy-900 border-border-hairline dark:border-outline-variant"
              }`}
            >
              <span
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  activeCheckin.active ? "bg-emerald-500 animate-pulse" : "bg-outline dark:bg-outline-variant"
                }`}
              />
              <div className="text-sm min-w-0">
                {activeCheckin.active ? (
                  <>
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                      Checked in{activeCheckin.plate ? <> — <span className="font-mono">{activeCheckin.plate}</span></> : null}
                    </p>
                    <p className={`text-xs ${th.textSecondary} mt-0.5`}>
                      {activeCheckin.time ? new Date(activeCheckin.time).toLocaleString() : ""}
                      {activeCheckin.location ? ` · ${activeCheckin.location}` : ""} · driving hours running
                    </p>
                  </>
                ) : (
                  <>
                    <p className={`font-medium ${th.text}`}>Not checked in</p>
                    <p className={`text-xs ${th.textSecondary} mt-0.5`}>
                      Check this driver in (with their assigned vehicle) to start driving hours, then check out when the trip ends.
                    </p>
                  </>
                )}
              </div>
            </div>

            {checkError && (
              <div className="flex items-center gap-2 text-sm text-error mb-3">
                <Icon name="error" size={16} />
                {checkError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Check In */}
              <div className="space-y-3">
                <h5 className={`font-medium ${th.text}`}>Check In</h5>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Vehicle</label>
                  <select
                    value={checkInVehicleId}
                    onChange={(e) => setCheckInVehicleId(e.target.value)}
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.filter((v) => v.status === "ACTIVE").map((v) => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Location</label>
                  <input
                    type="text"
                    value={checkInLocation}
                    onChange={(e) => setCheckInLocation(e.target.value)}
                    placeholder="Enter location"
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  />
                </div>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Remark (optional)</label>
                  <input
                    type="text"
                    value={checkInRemark}
                    onChange={(e) => setCheckInRemark(e.target.value)}
                    placeholder="Any notes..."
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  />
                </div>
                <Button
                  accent="admin"
                  onClick={handleAdminCheckIn}
                  disabled={activeCheckin.active || !checkInVehicleId || !checkInLocation || checkingIn}
                  className="w-full"
                >
                  {checkingIn ? "Checking In..." : activeCheckin.active ? "Already Checked In" : "Check In"}
                </Button>
              </div>

              {/* Check Out */}
              <div className="space-y-3">
                <h5 className={`font-medium ${th.text}`}>Check Out</h5>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Vehicle</label>
                  <select
                    value={checkOutVehicleId}
                    onChange={(e) => setCheckOutVehicleId(e.target.value)}
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.filter((v) => v.status === "ACTIVE").map((v) => (
                      <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Location</label>
                  <input
                    type="text"
                    value={checkOutLocation}
                    onChange={(e) => setCheckOutLocation(e.target.value)}
                    placeholder="Enter location"
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  />
                </div>
                <div>
                  <label className={`text-sm ${th.textSecondary}`}>Remark (optional)</label>
                  <input
                    type="text"
                    value={checkOutRemark}
                    onChange={(e) => setCheckOutRemark(e.target.value)}
                    placeholder="Any notes..."
                    className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAdminCheckOut}
                  disabled={!activeCheckin.active || !checkOutVehicleId || !checkOutLocation || checkingOut}
                  className="w-full border-amber-400 text-amber-600 dark:text-amber-400 dark:border-amber-500/50"
                >
                  {checkingOut ? "Checking Out..." : !activeCheckin.active ? "Not Checked In" : "Check Out"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Create Task Form */}
          <Card className="p-4">
            <h4 className={`font-semibold ${th.text} mb-3`}>Assign New Task</h4>
            <div className="space-y-3">
              <div>
                <label className={`text-sm ${th.textSecondary}`}>Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Vehicle inspection, Office duty"
                  className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                />
              </div>
              <div>
                <label className={`text-sm ${th.textSecondary}`}>Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                  className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500 resize-none`}
                />
              </div>
              <div>
                <label className={`text-sm ${th.textSecondary}`}>Vehicle (optional)</label>
                <select
                  value={taskVehicleId}
                  onChange={(e) => setTaskVehicleId(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                >
                  <option value="">No vehicle</option>
                  {vehicles.filter((v) => v.status === "ACTIVE").map((v) => (
                    <option key={v.id} value={v.id}>{v.plate} — {v.make} {v.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-sm ${th.textSecondary}`}>Estimated Duration (hours)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={taskDurationHours}
                  onChange={(e) => setTaskDurationHours(e.target.value)}
                  placeholder="e.g. 2"
                  className={`w-full mt-1 px-3 py-2 text-sm rounded-lg border ${th.bgInput} ${th.border} ${th.text} focus:outline-none focus:border-emerald-500`}
                />
              </div>
              <Button
                accent="admin"
                onClick={handleCreateTask}
                disabled={!taskTitle.trim() || creatingTask}
                className="w-full"
              >
                {creatingTask ? "Creating..." : "Assign Task"}
              </Button>
            </div>
          </Card>

          {/* Task List */}
          <Card className="p-4">
            <h4 className={`font-semibold ${th.text} mb-3`}>Tasks ({tasks.length})</h4>
            {tasks.length === 0 ? (
              <p className={`text-sm ${th.textMuted}`}>No tasks assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const isActive = t.status === "ACTIVE";
                  const estHours = t.estimatedDurationMs ? Math.round((t.estimatedDurationMs / 3600000) * 10) / 10 : null;
                  const actualHours = t.endedAt ? Math.round(((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 3600000) * 10) / 10 : null;
                  return (
                    <div key={t.id} className={`p-3 rounded-lg border ${th.border} ${isActive ? "" : "opacity-60"}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${th.text} truncate`}>{t.title}</p>
                            <Badge status={isActive ? "IN_PROGRESS" : "FEEDBACK_SUBMITTED"}>
                              {isActive ? "ACTIVE" : "DONE"}
                            </Badge>
                          </div>
                          {t.description && (
                            <p className={`text-xs ${th.textMuted} mt-1`}>{t.description}</p>
                          )}
                          <div className={`flex gap-3 mt-1 text-xs ${th.textSecondary}`}>
                            {t.vehiclePlate && <span className="font-mono">{t.vehiclePlate}</span>}
                            {estHours !== null && <span>Est: {estHours}h</span>}
                            {actualHours !== null && <span>Actual: {actualHours}h</span>}
                            <span>Started: {new Date(t.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {t.endedAt && <span>Ended: {new Date(t.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          {isActive && (
                            <Button accent="admin" onClick={() => handleCompleteTask(t.id)} className="text-xs px-2 py-1">
                              Complete
                            </Button>
                          )}
                          <button
                            onClick={() => setDeletingTaskId(t.id)}
                            className={`p-1 rounded hover:bg-red-500/10 text-red-500`}
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Records Tab */}
      {tab === "records" && (
        <Card className="p-4">
          <p className={`text-sm ${th.textSecondary}`}>Operational records and check-in/out history for this driver will appear here.</p>
          <p className={`text-xs ${th.textMuted} mt-2`}>Feature coming soon — this requires per-driver trip history data from the backend.</p>
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmAction === "issue"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { onIssueCert(confirmCertLevel, "2027-12-31"); setConfirmAction(null); }}
        title="Issue Certificate"
        message={`Issue ${confirmCertLevel} certification to ${driver.name}? This will set their cert status to CERTIFIED.`}
        confirmLabel="Issue Certificate"
      />

      <ConfirmDialog
        open={confirmAction === "revoke"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { onRevokeCert(confirmReason); setConfirmAction(null); setConfirmReason(""); }}
        title="Revoke Certificate"
        message={`Revoke ${driver.certLevel} certification from ${driver.name}?`}
        confirmLabel="Revoke"
        danger
      />

      <ConfirmDialog
        open={confirmAction === "suspend"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { onSuspendDriver(confirmReason); setConfirmAction(null); setConfirmReason(""); }}
        title="Suspend Driver"
        message={`Suspend ${driver.name}? They will not be assignable to new trips.`}
        confirmLabel="Suspend"
        danger
      />

      <ConfirmDialog
        open={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { onDeleteDriver(); setConfirmAction(null); }}
        title="Delete Driver"
        message={`Permanently delete ${driver.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      <ConfirmDialog
        open={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
