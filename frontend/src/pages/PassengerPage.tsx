import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner, ThemeToggle, ToastProvider, th, Icon } from "../components/ui";
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

type Tab = "home" | "requests" | "new" | "profile" | "notifications";

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "requests", label: "Trips", icon: "receipt_long" },
  { key: "new", label: "Request", icon: "add_circle" },
  { key: "notifications", label: "Alerts", icon: "notifications" },
  { key: "profile", label: "Profile", icon: "person" },
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

  useEffect(() => { loadData(); }, [tab]);

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
      const [reqData, notifData, countData] = await Promise.all([getRequests(), getNotifications(), getUnreadCount()]);
      setRequests(reqData.requests);
      setNotifications(notifData);
      setUnreadCount(countData.count);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreateRequest(data: { department: string; pickup: string; destination: string; date: string; time: string; noOfPeople: number; wayUsers: string; section: string; serviceType: string; purpose: string; returnTime: string; note: string }) {
    try { await createRequest(data); setTab("requests"); loadData(); } catch (err) { console.error(err); }
  }

  async function handlePickupScan(requestId: string) { try { await pickupQRScan(requestId); loadData(); } catch (err) { console.error(err); } }
  async function handleDropoffScan(requestId: string) { try { await dropoffQRScan(requestId); loadData(); } catch (err) { console.error(err); } }
  async function handleSubmitFeedback(requestId: string, data: { rating: number; comment: string; tags: string[] }) {
    try { await submitFeedback(requestId, data); setFeedbackRequest(null); loadData(); } catch (err) { console.error(err); }
  }

  return (
    <ToastProvider>
      <div className={`min-h-screen ${th.bg}`}>
        <div className={`${th.header} px-4 py-3 flex items-center justify-between sticky top-0 z-30`}>
          <div className="flex items-center gap-2">
            <img src="/pccp-logo.png" alt="PCCP" className="w-8 h-8 rounded-lg object-contain" />
            <h1 className="text-lg font-semibold text-on-surface dark:text-white">PCCP</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setTab("notifications")} className="relative p-2">
              <Icon name="notifications" size={20} className="text-on-surface-variant dark:text-outline-variant" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-error text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="text-sm text-on-surface-variant dark:text-outline-variant hidden sm:inline">{user?.name}</span>
            <button onClick={logout} className="text-on-surface-variant hover:text-error transition-colors">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 pb-20">
          {loading ? <LoadingSpinner /> : (
            <>
              {tab === "home" && user && (
                <PassengerHome user={user} requests={requests} onNewRequest={() => setTab("new")} onViewRequests={() => setTab("requests")} onViewRequest={(r) => { setSelectedRequest(r); setTab("requests"); }} />
              )}
              {tab === "new" && user && <CreateRequestForm user={user} onSubmit={handleCreateRequest} onCancel={() => setTab("home")} />}
              {tab === "requests" && (
                <PassengerRequests requests={requests} onSelect={(r) => setSelectedRequest(r)} onBack={() => { setSelectedRequest(null); setTab("home"); }} selectedRequest={selectedRequest} onPickupScan={handlePickupScan} onDropoffScan={handleDropoffScan} onFeedback={(r) => setFeedbackRequest(r)} />
              )}
                {tab === "notifications" && <PassengerNotifications notifications={notifications} requests={requests} onBack={() => setTab("home")} onMarkAllRead={async () => { await markAllNotificationsRead(); loadData(); }} />}
              {tab === "profile" && user && <PassengerProfile user={user} requests={requests} onBack={() => setTab("home")} />}
              {feedbackRequest && <FeedbackForm request={feedbackRequest} onSubmit={(data) => handleSubmitFeedback(feedbackRequest.id, data)} onClose={() => setFeedbackRequest(null)} />}
            </>
          )}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 ${th.bottomNav} flex justify-around py-2 z-30`}>
          {NAV_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)} className={`flex flex-col items-center gap-1 px-3 py-1 ${tab === item.key ? "text-role-passenger" : "text-on-surface-variant"}`}>
              <Icon name={item.icon} size={20} fill={tab === item.key} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}
