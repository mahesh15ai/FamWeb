import { useEffect, useState, useRef } from "react";
import {
  LogOut,
  Users,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X,
  SlidersHorizontal,
  Inbox,
  UserCheck,
  UserCog,
  GitBranch,
  Layers,
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  UserPlus,
  Sparkles,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as joinRequestsApi from "../api/joinRequests";
import * as familiesApi from "../api/families";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notificationService";
import { resolveMediaUrl } from "../utils/media";
import SearchModal from "./SearchModal";

function formatShortTime(timestamp) {
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
  });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);

  // States
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [canManageRequests, setCanManageRequests] = useState(false);
  const [family, setFamily] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const isOwnerOrAdmin =
    family?.owner_id === user?.id ||
    family?.created_by === user?.id ||
    user?.role === "admin" ||
    family?.user_role === "admin" ||
    family?.user_role === "owner";

  // Ctrl + K Shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch Family & Requests
  useEffect(() => {
    familiesApi
      .getMyFamily()
      .then((fam) => {
        setFamily(fam);

        const isManager =
          fam?.owner_id === user?.id ||
          fam?.created_by === user?.id ||
          user?.role === "admin" ||
          fam?.user_role === "admin" ||
          fam?.user_role === "owner";

        if (isManager) {
          joinRequestsApi
            .listJoinRequests()
            .then((requests) => {
              setCanManageRequests(true);
              setPendingCount(
                requests.filter((r) => r.status === "PENDING").length
              );
            })
            .catch(() => setCanManageRequests(false));
        } else {
          setCanManageRequests(false);
        }
      })
      .catch(() => setFamily(null));

    setMobileNavOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname, user?.id]);

  // Notifications Fetch
  const fetchNotificationsList = async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data.results || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotificationsList();
    const interval = setInterval(fetchNotificationsList, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, targetUrl) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (targetUrl) {
        setNotifOpen(false);
        navigate(targetUrl);
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchNotificationsList();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_post":
      case "new_comment":
        return <MessageSquare size={14} className="text-brand-600" />;
      case "new_event":
        return <Calendar size={14} className="text-amber-600" />;
      case "join_request":
      case "request_accepted":
        return <UserPlus size={14} className="text-emerald-600" />;
      case "birthday":
        return <Sparkles size={14} className="text-rose-500" />;
      default:
        return <Bell size={14} className="text-stone-500" />;
    }
  };

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.info("Logged out successfully.");
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  // Primary links shown directly on Navbar
  const primaryLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/posts", label: "Feed", icon: MessageSquare },
    { to: "/albums", label: "Albums", icon: Layers },
    { to: "/events", label: "Events", icon: Calendar },
  ];

  // Secondary links tucked cleanly into the "More" dropdown
  const secondaryLinks = [
    { to: "/families/members", label: "Directory", icon: Users },
    { to: "/families/tree", label: "Family Tree", icon: GitBranch },
    ...(canManageRequests
      ? [
          {
            to: "/families/join-requests",
            label: "Join Requests",
            icon: Inbox,
            badge: pendingCount,
          },
        ]
      : []),
  ];

  const allNavLinks = [...primaryLinks, ...secondaryLinks];
  const isSecondaryActive = secondaryLinks.some((link) => location.pathname === link.to);
  const logoUrl = resolveMediaUrl(family?.logo);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Family Logo & Main Navigation */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 focus:outline-hidden transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${family?.name || "Family"} logo`}
                className="h-9 w-9 rounded-xl object-cover border border-stone-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
                {family?.name?.[0]?.toUpperCase() || "F"}
              </div>
            )}
            <span className="font-extrabold text-stone-900 tracking-tight text-base whitespace-nowrap">
              {family?.name ?? "FamilyHub"}
            </span>
          </button>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryLinks.map(({ to, label, icon: Icon }) => {
              const active =
                location.pathname === to ||
                (to === "/albums" && location.pathname.startsWith("/albums"));
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  type="button"
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-stone-100 text-stone-900 font-bold shadow-xs"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-brand-600" : "text-stone-400"
                    }`}
                  />
                  <span>{label}</span>
                </button>
              );
            })}

            {/* "More" Dropdown Menu (Directory, Tree, Requests) */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isSecondaryActive
                    ? "bg-stone-100 text-stone-900 font-bold"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <MoreHorizontal className="w-4 h-4 text-stone-400" />
                <span>More</span>
                {pendingCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
                <ChevronDown
                  size={12}
                  className={`text-stone-400 transition-transform duration-150 ${
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white border border-stone-200/80 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {secondaryLinks.map(({ to, label, icon: Icon, badge }) => {
                    const active = location.pathname === to;
                    return (
                      <button
                        key={to}
                        onClick={() => {
                          setMoreMenuOpen(false);
                          navigate(to);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? "bg-brand-50 text-brand-700 font-bold"
                            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 ${
                              active ? "text-brand-600" : "text-stone-400"
                            }`}
                          />
                          <span>{label}</span>
                        </div>
                        {!!badge && badge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-xs">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Search + Notifications + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            type="button"
            className="flex items-center gap-2 bg-stone-100/80 hover:bg-stone-100 text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-stone-200/60 cursor-pointer"
          >
            <Search size={14} className="text-stone-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded-md font-mono text-stone-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setMenuOpen(false);
                if (!notifOpen) fetchNotificationsList();
              }}
              type="button"
              aria-label="Notifications"
              className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200/80 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-stone-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-100">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        navigate("/notifications");
                      }}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-900 cursor-pointer"
                    >
                      View all →
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-10 h-10 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Bell size={18} />
                    </div>
                    <p className="text-xs font-semibold text-stone-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleMarkAsRead(item.id, item.target_url)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          item.is_read
                            ? "bg-white border-stone-100 hover:bg-stone-50"
                            : "bg-brand-50/40 border-brand-200/70 hover:bg-brand-50/70"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 bg-white rounded-xl shadow-2xs border border-stone-200/50 shrink-0 mt-0.5">
                            {getNotificationIcon(item.notification_type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {item.title}
                            </p>
                            {item.message && (
                              <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                                {item.message}
                              </p>
                            )}
                            <span className="text-[10px] font-semibold text-stone-400 mt-1 block">
                              {formatShortTime(item.created_at)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          className="text-stone-300 hover:text-rose-600 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Dismiss"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setMenuOpen((open) => !open);
                setNotifOpen(false);
              }}
              type="button"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <div className="h-8 w-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold border border-brand-200/60 shadow-xs shrink-0">
                {initials}
              </div>
              <ChevronDown
                size={13}
                className={`text-stone-400 transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200/80 rounded-2xl shadow-xl py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-stone-100">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile/edit");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-semibold cursor-pointer"
                  >
                    <UserCog size={15} className="text-stone-400" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/notifications");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-semibold cursor-pointer"
                  >
                    <Bell size={15} className="text-stone-400" />
                    Notifications
                  </button>

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/families/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-semibold cursor-pointer"
                    >
                      <SlidersHorizontal size={15} className="text-stone-400" />
                      Family Settings
                    </button>
                  )}
                </div>

                <div className="border-t border-stone-100 pt-1">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    <LogOut size={15} />
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileNavOpen((open) => !open)}
            type="button"
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-stone-200/80 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <div className="space-y-1">
            {allNavLinks.map(({ to, label, icon: Icon, badge }) => {
              const active =
                location.pathname === to ||
                (to === "/albums" && location.pathname.startsWith("/albums"));
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-brand-50 text-brand-700 font-bold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-brand-600" : "text-stone-400"
                      }`}
                    />
                    <span>{label}</span>
                  </div>
                  {!!badge && badge > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-stone-100 pt-3 space-y-1">
            <button
              onClick={() => {
                setMobileNavOpen(false);
                setSearchOpen(true);
              }}
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer"
            >
              <Search className="w-4 h-4 text-stone-400" />
              <span>Search Workspace</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Search Command Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}