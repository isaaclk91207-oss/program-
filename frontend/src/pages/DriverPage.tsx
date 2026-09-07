import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner, ThemeToggle, ToastProvider, th } from "../components/ui";
import { DriverHome, TripsList, DriverProfile, DriverNotifications, PassportCard, QRScan, TripCalendar } from "../components/driver";
import {
  getDriverTrips,
  getDriverTripsV2,
  getDriverV2,
  driverCheckIn,
  driverCheckOut,
  getNotifications,
  markAllNotificationsRead,
  getUnreadCount,
} from "../services/api";
import type { TransportRequest, Notification } from "../types";
import { Home, Map, User, Bell, LogOut, ShieldCheck, QrCode, Calendar } from "lucide-react";

type Tab = "home" | "trips" | "profile" | "notifications" | "passport" | "qr" | "calendar";

const NAV_ITEMS = [
  { key: "home" as const, label: "Home", icon: Home },
  { key: "trips" as const, label: "Trips", icon: Map },
  { key: "profile" as const, label: "Profile", icon: User },
  { key: "notifications" as const, label: "Alerts", icon: Bell },
];

export default function DriverPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [trips, setTrips] = useState<TransportRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  // v2 driver ID for Thura Ko Ko (Wialon Driver ID: 54, Unit ID: 5731)
  const [v2DriverId] = useState<string>("bb81fd7e-1d9c-4cd5-b2c0-d7859a6d82a7");

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch trips from v2, notifications from v1
      const [tripsData, notifData, countData] = await Promise.all([
        getDriverTripsV2(v2DriverId).catch(() => getDriverTrips()),
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
      <div className={`min-h-screen ${th.bg}`}>
        <div className={`${th.header} px-4 py-3 flex items-center justify-between sticky top-0 z-30`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-navy-950">P</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">PCCP Driver</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setTab("notifications")} className="relative p-2">
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">{user?.name}</span>
            <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 pb-20">
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

        <div className={`fixed bottom-0 left-0 right-0 ${th.bottomNav} flex justify-around py-2 z-30`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  tab === item.key ? "text-amber-500 dark:text-amber-400" : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ToastProvider>
  );
}

function PassportCardWrapper({ user, onBack }: { user: { id: string; name: string; email: string }; onBack: () => void }) {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const v2DriverId = "bb81fd7e-1d9c-4cd5-b2c0-d7859a6d82a7";

  useEffect(() => {
    import("../services/api").then(({ getDriverV2, getDriver }) => {
      getDriverV2(v2DriverId).then((d) => {
        setDriver(d);
        setLoading(false);
      }).catch(() => {
        // Fallback to v1
        getDriver(user.id).then((d) => {
          setDriver(d);
          setLoading(false);
        }).catch(() => setLoading(false));
      });
    });
  }, [user.id, v2DriverId]);

  if (loading) return <LoadingSpinner />;
  if (!driver) return <div className="text-center py-8 text-slate-500">Driver profile not found</div>;
  return <PassportCard driver={driver} />;
}
