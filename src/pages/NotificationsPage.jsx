import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  UserPlus,
  Sparkles,
  ArrowRight,
  Filter,
  Inbox,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notificationService";
import { useToast } from "../context/ToastContext";

function formatFullTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'unread' | 'posts' | 'events' | 'requests'

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filterType === "unread") return !item.is_read;
      if (filterType === "posts")
        return item.notification_type === "new_post" || item.notification_type === "new_comment";
      if (filterType === "events") return item.notification_type === "new_event";
      if (filterType === "requests")
        return item.notification_type === "join_request" || item.notification_type === "request_accepted";
      return true;
    });
  }, [notifications, filterType]);

  const handleMarkAsRead = async (id, targetUrl) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (targetUrl) {
        navigate(targetUrl);
      }
    } catch (err) {
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const deletedItem = notifications.find((n) => n.id === id);
        return deletedItem && !deletedItem.is_read ? Math.max(0, prev - 1) : prev;
      });
      toast.info("Notification dismissed.");
    } catch (err) {
      toast.error("Failed to dismiss notification.");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_post":
      case "new_comment":
        return <MessageSquare size={16} className="text-brand-600" />;
      case "new_event":
        return <Calendar size={16} className="text-amber-600" />;
      case "join_request":
      case "request_accepted":
        return <UserPlus size={16} className="text-emerald-600" />;
      case "birthday":
        return <Sparkles size={16} className="text-rose-500" />;
      default:
        return <Bell size={16} className="text-stone-500" />;
    }
  };

  const tabs = [
    { key: "all", label: `All (${notifications.length})` },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "posts", label: "Posts & Feed" },
    { key: "events", label: "Events" },
    { key: "requests", label: "Join Requests" },
  ];

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-brand-600" />
              Notifications & Activity
            </h1>
            <p className="text-xs font-semibold text-stone-500 mt-1">
              Review real-time alerts, family announcements, and workspace activity history.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              type="button"
              className="inline-flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`text-xs font-bold px-4 py-2 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.key
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200/70 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-stone-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Inbox size={26} />
            </div>
            <h3 className="text-base font-bold text-stone-800">No Notifications</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              You are all caught up! When family members post, schedule events, or request access, you'll see alerts here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id, item.target_url)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                  item.is_read
                    ? "bg-white border-stone-200/80 hover:border-stone-300 shadow-xs"
                    : "bg-brand-50/50 border-brand-200 ring-1 ring-brand-300/30 hover:bg-brand-50/80 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 bg-white rounded-2xl shadow-2xs border border-stone-200/60 shrink-0 group-hover:scale-105 transition-transform">
                    {getNotificationIcon(item.notification_type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 animate-pulse" />
                      )}
                    </div>
                    {item.message && (
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {item.message}
                      </p>
                    )}
                    <span className="text-[11px] font-semibold text-stone-400 block pt-0.5">
                      {formatFullTime(item.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform mr-1">
                    View <ArrowRight size={13} />
                  </span>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}