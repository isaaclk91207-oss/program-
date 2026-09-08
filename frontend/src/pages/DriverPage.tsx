import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner, ThemeToggle, ToastProvider, Icon } from "../components/ui";
import { DriverHome, TripsList, DriverProfile, DriverNotifications, PassportCard, QRScan, TripCalendar } from "../components/driver";
import {
  getDriverTrips,
  getDriver,
  driverCheckIn,
  driverCheckOut,
  getNotifications,
  markAllNotificationsRead,
  getUnreadCount,
} from "../services/api";
import type { TransportRequest, Notification } from "../types";

type Tab = "home" | "trips" | "profile" | "notifications" | "passport" | "qr" | "calendar";

const MOBILE_NAV = [
  { key: "home" as const, label: "Home", icon: "home" },
  { key: "trips" as const, label: "Trips", icon: "local_shipping" },
  { key: "profile" as const, label: "Profile", icon: "person" },
  { key: "notifications" as const, label: "Alerts", icon: "notifications" },
];

const SIDE_NAV = [
  { key: "home" as const, label: "Home", icon: "home" },
  { key: "trips" as const, label: "My Trips", icon: "route" },
  { key: "notifications" as const, label: "Alerts", icon: "notifications" },
];

function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DriverPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [trips, setTrips] = useState<TransportRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

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
      // Fetch trips from v2, notifications from v1
      const [tripsData, notifData, countData] = await Promise.all([
        getDriverTrips().catch(() => []),
        getNotifications().catch(() => []),
        getUnreadCount().catch(() => ({ count: 0 })),
      ]);
      setTrips(tripsData);
      setNotifications(notifData);
      setUnreadCount(countData.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(vehiclePlate: string, location: string, remark?: string) {
    try {
      await driverCheckIn({ vehiclePlate, location, remark });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCheckOut(vehiclePlate: string, location: string, remark?: string) {
    try {
      await driverCheckOut({ vehiclePlate, location, remark });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const activeTrips = trips.filter((t) => ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "PENDING"].includes(t.status));
  const completedTrips = trips.filter((t) => ["DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED", "DROPOFF_COMPLETE", "COMPLETED"].includes(t.status));

  return (
    <ToastProvider>
      <div className={thCanvas}>
        {/* Mobile Top App Bar */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-surface dark:bg-inverse-surface border-b border-border-hairline dark:border-outline-variant flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/pccp-logo.png" alt="PCCP" className="w-7 h-7 rounded object-contain" />
            <h1 className="font-title-lg text-title-lg font-bold text-role-driver">PCCP Driver</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="p-2 text-on-surface-variant dark:text-outline-variant">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setTab("notifications")}
              className="relative p-2 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-navy-900 rounded-full transition-colors"
            >
              <Icon name="notifications" size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-error text-on-error text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-role-driver-container text-role-driver flex items-center justify-center text-xs font-bold">
              {initials(user?.name || "D")}
            </div>
            <button
              onClick={logout}
              className="p-2 text-on-surface-variant dark:text-outline-variant hover:text-error transition-colors"
              title="Logout"
            >
              <Icon name="logout" size={22} />
            </button>
          </div>
        </header>

        {/* Desktop Side Navigation */}
        <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 bg-surface dark:bg-inverse-surface border-r border-border-hairline dark:border-outline-variant z-40">
          <div className="px-8 py-8 border-b border-border-hairline dark:border-outline-variant">
            <div className="flex items-center gap-2">
              <img src="/pccp-logo.png" alt="PCCP" className="w-8 h-8 rounded object-contain" />
              <h1 className="font-headline-md text-headline-md font-bold text-role-driver">PCCP Vector</h1>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
            {SIDE_NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-title-md text-title-md ${
                  tab === item.key
                    ? "bg-role-driver-container text-role-driver dark:bg-purple-500/20 dark:text-purple-400 font-bold"
                    : "text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-navy-900"
                }`}
              >
                <Icon name={item.icon} size={24} fill={tab === item.key} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border-hairline dark:border-outline-variant">
            <button
              onClick={() => setTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-title-md text-title-md ${
                tab === "profile"
                  ? "bg-role-driver-container text-role-driver dark:bg-purple-500/20 dark:text-purple-400 font-bold"
                  : "text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-navy-900"
              }`}
            >
              <Icon name="person" size={24} fill={tab === "profile"} />
              <span>Account</span>
            </button>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <main className="md:ml-[260px] mt-14 md:mt-0 min-h-screen">
          <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full pb-28 md:pb-10">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {tab === "home" && user && (
                  <DriverHome
                    user={user}
                    activeTrips={activeTrips}
                    completedTrips={completedTrips}
                    onViewTrips={() => setTab("trips")}
                    onSelectTrip={(t) => { setSelectedTrip(t); setTab("trips"); }}
                    onPassport={() => setTab("passport")}
                    onCalendar={() => setTab("calendar")}
                  />
                )}
                {tab === "trips" && (
                  <TripsList
                    trips={trips}
                    selectedTrip={selectedTrip}
                    onSelectTrip={setSelectedTrip}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onBack={() => { setSelectedTrip(null); setTab("home"); }}
                  />
                )}
                {tab === "notifications" && (
                  <DriverNotifications
                    notifications={notifications}
                    onBack={() => setTab("home")}
                    onMarkAllRead={async () => {
                      await markAllNotificationsRead();
                      loadData();
                    }}
                  />
                )}
                {tab === "profile" && user && (
                  <DriverProfile user={user} trips={trips} onBack={() => setTab("home")} />
                )}
                {tab === "passport" && user && (
                  <PassportCardWrapper user={user} onBack={() => setTab("profile")} />
                )}
                {tab === "qr" && selectedTrip?.vehiclePlate && (
                  <QRScan
                    vehiclePlate={selectedTrip.vehiclePlate}
                    onScanComplete={(verified) => {
                      if (verified) {
                        loadData();
                      }
                      setTab("trips");
                    }}
                    onBack={() => setTab("trips")}
                  />
                )}
                {tab === "calendar" && (
                  <TripCalendar
                    trips={trips}
                    onSelectTrip={(t) => { setSelectedTrip(t); setTab("trips"); }}
                    onBack={() => setTab("home")}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Bottom Navigation Bar (Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface dark:bg-inverse-surface border-t border-border-hairline dark:border-outline-variant rounded-t-xl shadow-md flex justify-around items-center h-16">
          {MOBILE_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-colors ${
                tab === item.key
                  ? "bg-role-driver text-white"
                  : "text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-surface-variant"
              }`}
            >
              <Icon name={item.icon} size={24} fill={tab === item.key} className="mb-0.5" />
              <span className="font-body-sm text-body-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}

const thCanvas =
  "min-h-screen bg-surface-canvas dark:bg-navy-950 text-on-surface dark:text-white antialiased";

function PassportCardWrapper({ user, onBack }: { user: { id: string; name: string; email: string }; onBack: () => void }) {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDriver(user.id).then((d) => {
      setDriver(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  if (loading) return <LoadingSpinner />;
  if (!driver) return <div className="text-center py-8 text-on-surface-variant dark:text-white">Driver profile not found</div>;
  return <PassportCard driver={driver} />;
}