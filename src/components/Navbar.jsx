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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as joinRequestsApi from "../api/joinRequests";
import * as familiesApi from "../api/families";
import { resolveMediaUrl } from "../utils/media";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [canManageRequests, setCanManageRequests] = useState(false);
  const [family, setFamily] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  const isOwnerOrAdmin =
    family?.owner_id === user?.id ||
    family?.created_by === user?.id ||
    user?.role === "admin" ||
    family?.user_role === "admin" ||
    family?.user_role === "owner";

  useEffect(() => {
    familiesApi.getMyFamily().then(setFamily).catch(() => setFamily(null));

    joinRequestsApi
      .listJoinRequests()
      .then((requests) => {
        setCanManageRequests(true);
        setPendingCount(
          requests.filter((r) => r.status === "PENDING").length
        );
      })
      .catch(() => {
        setCanManageRequests(false);
      });

    setMobileNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Click Outside Listener for User Dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  const logoUrl = resolveMediaUrl(family?.logo);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 focus:outline-none rounded-xl transition-transform active:scale-[0.98]"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${family?.name || "Family"} logo`}
                className="h-9 w-9 rounded-xl object-cover border border-stone-200/80 shadow-sm"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                {family?.name?.[0]?.toUpperCase() || "F"}
              </div>
            )}
            <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg">
              {family?.name ?? "FamilyHub"}
            </span>
          </button>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, badge }) => {
              const active = location.pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  type="button"
                  className={`relative flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl transition-all duration-150 ${
                    active
                      ? "bg-stone-100 text-stone-900 shadow-sm"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-brand-600" : "text-stone-400"}`} />
                  <span>{label}</span>
                  {!!badge && badge > 0 && (
                    <span className="relative flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative">{badge}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Dropdown & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-stone-100/80 transition-colors focus:outline-none"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold border border-brand-200/60 shadow-sm">
                {initials}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-bold text-stone-900 leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] font-medium text-stone-400 leading-tight mt-0.5 truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
              <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 hidden sm:block ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200/80 rounded-2xl shadow-lg py-1.5 z-20">
                <div className="px-4 py-2.5 border-b border-stone-100">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-stone-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile/edit");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-medium"
                  >
                    <UserCog size={16} className="text-stone-400" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/families/members");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-medium"
                  >
                    <UserCheck size={16} className="text-stone-400" />
                    Family Directory
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/families/tree");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-medium"
                  >
                    <GitBranch size={16} className="text-stone-400" />
                    Family Tree
                  </button>

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/families/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors font-medium"
                    >
                      <SlidersHorizontal size={16} className="text-stone-400" />
                      Family Settings
                    </button>
                  )}
                </div>

                <div className="border-t border-stone-100 pt-1">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-60"
                  >
                    <LogOut size={16} />
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileNavOpen((open) => !open)}
            type="button"
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-stone-200/80 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <div className="space-y-1">
            {navLinks.map(({ to, label, icon: Icon, badge }) => {
              const active = location.pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${active ? "text-brand-600" : "text-stone-400"}`} />
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

          <div className="border-t border-stone-100 pt-3">
            <button
              onClick={() => navigate("/profile/edit")}
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 rounded-xl"
            >
              <UserCog className="w-5 h-5 text-stone-400" />
              <span>Edit Profile</span>
            </button>

            {isOwnerOrAdmin && (
              <button
                onClick={() => navigate("/families/settings")}
                type="button"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 rounded-xl"
              >
                <SlidersHorizontal className="w-5 h-5 text-stone-400" />
                <span>Family Settings</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-60"
            >
              <LogOut className="w-5 h-5" />
              <span>{loggingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}