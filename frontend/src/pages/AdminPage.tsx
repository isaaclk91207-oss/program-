import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner, ThemeToggle, ToastProvider, th } from "../components/ui";
import {
  AdminDashboard, DashboardCharts, RequestsList, DriversList, VehiclesList,
  FeedbackList, NotificationsList, SettingsPanel, OperationalRecords,
  AssessmentsOverview, PassengersList, ReportsPage, LiveVehicleMap,
} from "../components/admin";
import { convertToCSV, downloadCSV } from "../utils/csv";
import {
  getDashboard, getDrivers, getVehicles, getRequests, getAllFeedback, getNotifications, getUnreadCount,
  assignDriver, assignDriverV2, exportData, updateAssessment, updateSettings, getSettings,
  createDriver, createVehicle, deleteDriver, deleteVehicle, updateDriver,
  getAllDriversV2, getAllVehiclesV2, getAllRequestsV2, getMe, createNotification,
} from "../services/api";
import type { DashboardStats, Driver, Vehicle, TransportRequest, TransportStatus, Feedback, Notification } from "../types";
import {
  LayoutDashboard, ClipboardList, Car, Truck, Star, Bell, Settings, LogOut,
  Menu, X, History, BarChart3, Users, FileText,
} from "lucide-react";

type Page = "dashboard" | "requests" | "drivers" | "vehicles" | "feedback" | "notifications" | "settings" | "records" | "assessments" | "passengers" | "reports";

const NAV_ITEMS = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "requests" as const, label: "Transport Requests", icon: ClipboardList },
  { key: "drivers" as const, label: "Drivers", icon: Car },
  { key: "vehicles" as const, label: "Vehicles", icon: Truck },
  { key: "reports" as const, label: "Reports", icon: FileText },
  { key: "feedback" as const, label: "Feedback", icon: Star },
  { key: "records" as const, label: "Records", icon: History },
  { key: "assessments" as const, label: "Assessments", icon: BarChart3 },
  { key: "passengers" as const, label: "Passengers", icon: Users },
  { key: "notifications" as const, label: "Notifications", icon: Bell },
  { key: "settings" as const, label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { loadData(); }, [page]);

  // Validate JWT token matches expected role on mount
  useEffect(() => {
    getMe().then((me) => {
      if (me.role !== "ADMIN") {
        logout();
        window.location.href = "/";
      }
    }).catch(() => {
      logout();
      window.location.href = "/";
    });
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        setNotifications(await getNotifications());
        setUnreadCount((await getUnreadCount()).count);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      switch (page) {
        case "dashboard": setDashboard(await getDashboard()); break;
        case "requests": {
          const reqs = (await getRequests()).requests.map((r) => ({ ...r, version: "v1" as const })) as TransportRequest[];
          // Also fetch v2 requests, drivers, and vehicles for the assign modal
          try {
            const [v2Raw, v1Drivers, v2Drivers, v1Vehicles, v2Vehicles] = await Promise.all([
              getAllRequestsV2(),
              getDrivers(),
              getAllDriversV2(),
              getVehicles(),
              getAllVehiclesV2(),
            ]);
            // Map v2 requests to TransportRequest shape
            const v2Reqs = (Array.isArray(v2Raw) ? v2Raw : []).map((r: Record<string, unknown>) => {
              const dateStr = r.requestDate ? new Date(r.requestDate as string) : new Date();
              const trip = r.trip as Record<string, unknown> | undefined;
              const tripDriver = trip?.driver as Record<string, unknown> | undefined;
              const tripVehicle = trip?.vehicle as Record<string, unknown> | undefined;
              return {
                id: r.id as string,
                requestNumber: r.requestNumber as string | undefined,
                passengerId: "",
                passengerName: (r.passengerName as string) || "",
                department: (r.department as string) || "",
                driverId: (tripDriver?.id as string) || null,
                driverName: (tripDriver?.name as string) || null,
                vehicleId: (tripVehicle?.id as string) || null,
                vehiclePlate: (tripVehicle?.plateNumber as string) || null,
                status: (r.status as TransportStatus) || "PENDING",
                pickup: (r.pickupLocation as string) || "",
                destination: (r.destination as string) || "",
                date: dateStr.toLocaleDateString(),
                time: dateStr.toLocaleTimeString(),
                qrScanStatus: null,
                feedbackStatus: null,
                createdAt: (r.createdAt as string) || new Date().toISOString(),
                version: "v2" as const,
              };
            });
            setRequests([...reqs, ...v2Reqs]);
            // Stamp version on v1 drivers, rebuild merge with v2 using ID-based dedup (fresh data each load)
            const v1DriversTagged = v1Drivers.map((d: Driver) => ({ ...d, version: "v1" as const }));
            const v1DriverIds = new Set(v1DriversTagged.map((d: Driver) => d.id));
            const mergedV2Drivers = v2Drivers
              .filter((d: { id: string }) => !v1DriverIds.has(d.id))
              .map((d: { id: string; name: string; status: string; employeeId: string; phone?: string }) => ({
                id: d.id,
                name: d.name,
                email: `${d.employeeId.toLowerCase()}@pccp.demo`,
                phone: d.phone || null,
                certLevel: "HO",
                certStatus: "CERTIFIED",
                validUntil: null,
                status: d.status === "AVAILABLE" ? "Active" : d.status === "ON_TRIP" ? "On Trip" : "Inactive",
                joinedDate: new Date().toISOString(),
                accidentFree: null,
                englishLevel: null,
                credits: 0,
                currentVehicleId: null,
                currentVehiclePlate: null,
                score: 0,
                rating: 0,
                employeeId: d.employeeId,
                version: "v2" as const,
              }));
            setDrivers([...v1DriversTagged, ...mergedV2Drivers]);
            // Stamp version on v1 vehicles, rebuild merge with v2 using ID-based dedup
            const v1VehiclesTagged = v1Vehicles.map((v: Vehicle) => ({ ...v, version: "v1" as const }));
            const v1VehicleIds = new Set(v1VehiclesTagged.map((v: Vehicle) => v.id));
            const mergedV2Vehicles = v2Vehicles
              .filter((v: { id: string }) => !v1VehicleIds.has(v.id))
              .map((v: { id: string; plateNumber: string; status: string }) => ({
                id: v.id,
                plate: v.plateNumber,
                qrValue: v.plateNumber,
                make: "",
                model: "",
                year: 0,
                color: "",
                status: (v.status === "ACTIVE" ? "ACTIVE" : v.status === "MAINTENANCE" ? "MAINTENANCE" : "RETIRED") as "ACTIVE" | "MAINTENANCE" | "RETIRED",
                version: "v2" as const,
              }));
            setVehicles([...v1VehiclesTagged, ...mergedV2Vehicles]);
          } catch {
            setRequests(reqs);
          }
          break;
        }
        case "drivers": {
          const [v1Drivers, v2Drivers] = await Promise.all([getDrivers(), getAllDriversV2()]);
          // Deduplicate by name: v1 drivers have clean IDs (DRV-XXX) and vehicle plates
          const v1Names = new Set(v1Drivers.map((d: Driver) => d.name));
          const v2Only = v2Drivers
            .filter((d: { name: string }) => !v1Names.has(d.name))
            .map((d: { id: string; name: string; status: string; employeeId: string; phone?: string }) => ({
              id: d.id,
              name: d.name,
              email: `${d.employeeId.toLowerCase()}@pccp.demo`,
              phone: d.phone || null,
              certLevel: "HO",
              certStatus: "CERTIFIED",
              validUntil: null,
              status: d.status === "AVAILABLE" ? "Active" : d.status === "ON_TRIP" ? "On Trip" : "Inactive",
              joinedDate: new Date().toISOString(),
              accidentFree: null,
              englishLevel: null,
              credits: 0,
              currentVehicleId: null,
              currentVehiclePlate: null,
              score: 0,
              rating: 0,
              employeeId: d.employeeId,
              version: "v2" as const,
            }));
          const v1DriversTagged = v1Drivers.map((d: Driver) => ({ ...d, version: "v1" as const }));
          setDrivers([...v1DriversTagged, ...v2Only]);
          break;
        }
        case "vehicles": setVehicles(await getVehicles()); break;
        case "feedback": setFeedbacks(await getAllFeedback()); break;
        case "notifications": setNotifications(await getNotifications()); break;
        case "settings": setSettings(await getSettings()); break;
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleExport = async (type: string) => {
    try { const data = await exportData(type); downloadCSV(convertToCSV(data), `pccp_${type}.csv`); } catch (err) { console.error(err); }
  };

  const handleAddDriver = async (data: { email: string; password: string; name: string; phone?: string }) => {
    try { await createDriver(data); loadData(); } catch (err) { console.error(err); }
  };

  const handleAddVehicle = async (data: { plate: string; make: string; model: string; year: number; color: string }) => {
    try { await createVehicle(data); loadData(); } catch (err) { console.error(err); }
  };

  const handleDeleteDriver = async (id: string) => {
    try { await deleteDriver(id); setSelectedDriver(null); loadData(); } catch (err) { console.error(err); }
  };

  const handleDeleteVehicle = async (id: string) => {
    try { await deleteVehicle(id); loadData(); } catch (err) { console.error(err); }
  };

  const handleUpdateDriver = async (id: string, data: Record<string, unknown>) => {
    try { await updateDriver(id, data); loadData(); } catch (err) { console.error(err); }
  };

  return (
    <ToastProvider>
      <div className={`min-h-screen ${th.bg} flex`}>
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${th.sidebar} p-4 flex flex-col shrink-0 transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-navy-950">P</span>
              </div>
              <h1 className="text-lg font-bold text-amber-600 dark:text-amber-400">PCCP Admin</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => { setPage(item.key); setSelectedDriver(null); setSelectedRequest(null); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${page === item.key ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : `${th.textSecondary} hover:${th.text}`}`}>
                  <Icon className="w-5 h-5" />{item.label}
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-navy-950 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className={`border-t ${th.border} pt-4 mt-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${th.text}`}>{user?.name}</p>
                <p className={`text-xs ${th.textMuted}`}>{user?.role}</p>
              </div>
              <button onClick={logout} className={`${th.textMuted} hover:text-rose-500 transition-colors`}><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className={`${th.header} px-4 py-3 flex items-center justify-between sticky top-0 z-30`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400"><Menu className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold capitalize">{page.replace(/_/g, " ")}</h2>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            {loading ? <LoadingSpinner /> : (
              <>
                {page === "dashboard" && dashboard && (
                  <>
                    <AdminDashboard data={dashboard} />
                    <LiveVehicleMap />
                    <DashboardCharts data={dashboard} />
                  </>
                )}
                {page === "requests" && (
                  <>
                    <RequestsList requests={requests} drivers={drivers} vehicles={vehicles}
                      selectedRequest={selectedRequest} onSelectRequest={setSelectedRequest}
                      showAssignModal={showAssignModal} onShowAssignModal={setShowAssignModal}
                      onAssign={async (rid, data) => {
                        setAssignError(null);
                        try {
                          const isV2 = selectedRequest?.version === "v2";
                          if (isV2) {
                            await assignDriverV2(rid, data);
                          } else {
                            await assignDriver(rid, data);
                          }

                          if (isV2 && selectedRequest) {
                            const driver = drivers.find(d => d.id === data.driverId);
                            const vehicle = vehicles.find(v => v.id === data.vehicleId);
                            const driverName = driver?.name || "a driver";
                            const plate = vehicle?.plate || "N/A";
                            const passengerName = selectedRequest.passengerName || "a passenger";
                            const pickup = selectedRequest.pickup || "";
                            const destination = selectedRequest.destination || "";

                            await Promise.all([
                              createNotification({
                                recipientId: selectedRequest.passengerId,
                                recipientRole: "PASSENGER",
                                title: "Transport Request Assigned",
                                message: `Your transport request ${rid} has been assigned to Driver ${driverName} with vehicle ${plate}.`,
                                relatedRequestId: rid,
                              }),
                              createNotification({
                                recipientId: data.driverId,
                                recipientRole: "DRIVER",
                                title: "New Transport Assigned",
                                message: `You have been assigned transport request ${rid} for ${passengerName} from ${pickup} to ${destination}.`,
                                relatedRequestId: rid,
                              }),
                            ]);
                          }

                          setShowAssignModal(false);
                          setSelectedRequest(null);
                          loadData();
                        } catch (err: unknown) {
                          const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
                          if (axiosErr.response?.status === 403) {
                            setAssignError("You need admin access. Please log in as admin.");
                          } else {
                            setAssignError(axiosErr.response?.data?.error?.message || "Assignment failed. Please try again.");
                          }
                        }
                      }}
                      onRefresh={loadData} />
                    {assignError && (
                      <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                        {assignError}
                        <button onClick={() => setAssignError(null)} className="ml-2 underline hover:no-underline">Dismiss</button>
                      </div>
                    )}
                  </>
                )}
                {page === "drivers" && (
                  <DriversList drivers={drivers} selectedDriver={selectedDriver} onSelectDriver={setSelectedDriver}
                    onUpdateAssessment={async (did, data) => { await updateAssessment(did, data); loadData(); }}
                    onRefresh={loadData} onExport={() => handleExport("drivers")} onAddDriver={handleAddDriver}
                    onDeleteDriver={handleDeleteDriver} onUpdateDriver={handleUpdateDriver} />
                )}
                {page === "vehicles" && (
                  <VehiclesList vehicles={vehicles} onRefresh={loadData} onExport={() => handleExport("vehicles")}
                    onAddVehicle={handleAddVehicle} onDeleteVehicle={handleDeleteVehicle} />
                )}
                {page === "feedback" && <FeedbackList feedbacks={feedbacks} onExport={() => handleExport("feedback")} />}
                {page === "notifications" && <NotificationsList notifications={notifications} />}
                {page === "records" && <OperationalRecords />}
                {page === "assessments" && <AssessmentsOverview />}
                {page === "passengers" && <PassengersList />}
                {page === "reports" && <ReportsPage />}
                {page === "settings" && settings && (
                  <SettingsPanel settings={settings} onSave={async (data) => { await updateSettings(data); loadData(); }} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
