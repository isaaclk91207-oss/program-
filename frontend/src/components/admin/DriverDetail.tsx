import { useState, useEffect } from "react";
import { Card, Button, Badge, CertBadge, ProgressBar, Tabs, th, ConfirmDialog, StarRating, Icon } from "../ui";
import { getDriverFeedback, getDrivingHours, getDriverTasks, createDriverTask, updateDriverTask, deleteDriverTask } from "../../services/api";
import { onTripStatusChanged } from "../../services/socket";
import type { Driver, Feedback, Assessment, TripHoursEntry, DriverTask } from "../../types";

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
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

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

  async function handleCreateTask() {
    if (!taskTitle.trim()) return;
    setCreatingTask(true);
    try {
      const durationMs = taskDurationHours ? Math.round(parseFloat(taskDurationHours) * 3600000) : undefined;
      await createDriverTask(driver.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        estimatedDurationMs: durationMs,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDurationHours("");
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
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={16} />
                <div>
                  <p className={th.textSecondary}>Trip Hours</p>
                  <p className={th.text}>{drivingHours ? `${drivingHours.tripHours}h (${drivingHours.tripCount} trips)` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="play_arrow" size={16} />
                <div>
                  <p className={th.textSecondary}>Driving Hours</p>
                  <p className={`${th.text} font-bold`}>{drivingHours ? `${drivingHours.drivingHours}h` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="hourglass_top" size={16} />
                <div>
                  <p className={th.textSecondary}>Waiting Time</p>
                  <p className={`${th.text} font-bold`}>{drivingHours ? `${Math.round((drivingHours.waitingTimeMs || 0) / 3600000 * 10) / 10}h` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="assignment" size={16} />
                <div>
                  <p className={th.textSecondary}>Task Hours</p>
                  <p className={`${th.text} font-bold`}>{drivingHours ? `${drivingHours.taskHours || 0}h` : "—"}</p>
                </div>
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
      {tab === "passport" && (
        <div className={`bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon name="shield" size={24} />
              <span className="text-sm font-medium opacity-80">PCCP Driver Passport</span>
            </div>
            <CertBadge level={driver.certLevel} />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {(driver.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{driver.name}</h3>
              <p className="text-sm opacity-80 font-mono">{getDisplayId(driver)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Icon name="credit_card" size={16} />
              <p className="text-lg font-bold">{driver.score}</p>
              <p className="text-xs opacity-70">Score</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Icon name="emoji_events" size={16} />
              <p className="text-lg font-bold">{driver.rating}</p>
              <p className="text-xs opacity-70">Rating</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Icon name="calendar_today" size={16} />
              <p className="text-lg font-bold">{driver.credits}</p>
              <p className="text-xs opacity-70">Credits</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm opacity-80">
            <div>
              <p className="opacity-70 text-xs">Valid Until</p>
              <p className="font-medium">{driver.validUntil || "—"}</p>
            </div>
            <div>
              <p className="opacity-70 text-xs">English Level</p>
              <p className="font-medium">{driver.englishLevel || "—"}</p>
            </div>
            <div>
              <p className="opacity-70 text-xs">Accident Free</p>
              <p className="font-medium">{driver.accidentFree || "—"}</p>
            </div>
          </div>
        </div>
      )}

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
