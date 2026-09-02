import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner, ThemeToggle, ToastProvider, th } from "../components/ui";
import { PassengerHome, CreateRequestForm, PassengerRequests, FeedbackForm, PassengerProfile, PassengerNotifications } from "../components/passenger";
import {
  getRequests,
  createRequest,
  submitFeedback,
  pickupQRScan,
  dropoffQRScan,
  getNotifications,
  markAllNotificationsRead,
  getUnreadCount,
} from "../services/api";
import type { TransportRequest, Notification } from "../types";
import { Home, ClipboardList, Plus, Bell, User, LogOut } from "lucide-react";

type Tab = "home" | "requests" | "new" | "profile" | "notifications";

const NAV_ITEMS = [
  { key: "home" as const, label: "Home", icon: Home },
  { key: "requests" as const, label: "Trips", icon: ClipboardList },
  { key: "new" as const, label: "Request", icon: Plus },
  { key: "notifications" as const, label: "Alerts", icon: Bell },
  { key: "profile" as const, label: "Profile", icon: User },
];

export default function PassengerPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackRequest, setFeedbackRequest] = useState<TransportRequest | null>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const [reqData, notifData, countData] = await Promise.all([
        getRequests(),
        getNotifications(),
        getUnreadCount(),
      ]);
      setRequests(reqData.requests);
      setNotifications(notifData);
      setUnreadCount(countData.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRequest(data: {
    department: string;
    pickup: string;
    destination: string;
    date: string;
    time: string;
  }) {
    try {
      await createRequest(data);
      setTab("requests");
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePickupScan(requestId: string) {
    try {
      await pickupQRScan(requestId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDropoffScan(requestId: string) {
    try {
      await dropoffQRScan(requestId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitFeedback(
    requestId: string,
    data: { rating: number; comment: string; tags: string[] }
  ) {
    try {
      await submitFeedback(requestId, data);
      setFeedbackRequest(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ToastProvider>
      <div className={`min-h-screen ${th.bg}`}>
        <div className={`${th.header} px-4 py-3 flex items-center justify-between sticky top-0 z-30`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-navy-950">P</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">PCCP</h1>
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
                <PassengerHome
                  user={user}
                  requests={requests}
                  onNewRequest={() => setTab("new")}
                  onViewRequests={() => setTab("requests")}
                  onViewRequest={(r) => { setSelectedRequest(r); setTab("requests"); }}
                />
              )}
              {tab === "new" && (
                <CreateRequestForm onSubmit={handleCreateRequest} onCancel={() => setTab("home")} />
              )}
              {tab === "requests" && (
                <PassengerRequests
                  requests={requests}
                  onSelect={(r) => setSelectedRequest(r)}
                  onBack={() => { setSelectedRequest(null); setTab("home"); }}
                  selectedRequest={selectedRequest}
                  onPickupScan={handlePickupScan}
                  onDropoffScan={handleDropoffScan}
                  onFeedback={(r) => { setFeedbackRequest(r); }}
                />
              )}
              {tab === "notifications" && (
                <PassengerNotifications
                  notifications={notifications}
                  onBack={() => setTab("home")}
                  onMarkAllRead={async () => {
                    await markAllNotificationsRead();
                    loadData();
                  }}
                />
              )}
              {tab === "profile" && user && (
                <PassengerProfile user={user} requests={requests} onBack={() => setTab("home")} />
              )}
              {feedbackRequest && (
                <FeedbackForm
                  request={feedbackRequest}
                  onSubmit={(data) => handleSubmitFeedback(feedbackRequest.id, data)}
                  onClose={() => setFeedbackRequest(null)}
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
