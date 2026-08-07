import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Copy,
  CopyCheck,
  UserPlus,
  SlidersHorizontal,
  ArrowUpRight,
  Activity,
  Building2,
  Calendar,
  Cake,
  FileText,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  MessageSquare,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as familiesApi from "../api/families";
import * as dashboardApi from "../api/dashboard";
import Navbar from "../components/Navbar";
import { resolveMediaUrl } from "../utils/media";

// Compact Relative Time Helper
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SubtleParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    let width = (canvas.width = canvas.offsetWidth * dpr);
    let height = (canvas.height = canvas.offsetHeight * dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * dpr;
      height = canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * (width / dpr),
      y: Math.random() * (height / dpr),
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height / dpr + 10;
          p.x = Math.random() * (width / dpr);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [todayBirthdays, setTodayBirthdays] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const familyData = await familiesApi.getMyFamily();
        if (!isMounted) return;
        setFamily(familyData);

        if (familyData) {
          const [statsData, activitiesData, eventsData, birthdaysData] =
            await Promise.allSettled([
              dashboardApi.getStatistics(),
              dashboardApi.getRecentActivities(),
              dashboardApi.getUpcomingEvents(),
              dashboardApi.getBirthdays(),
            ]);

          if (!isMounted) return;

          if (statsData.status === "fulfilled") setStats(statsData.value);
          if (activitiesData.status === "fulfilled")
            setActivities(activitiesData.value?.results ?? []);
          if (eventsData.status === "fulfilled")
            setEvents(eventsData.value?.results ?? []);
          if (birthdaysData.status === "fulfilled") {
            setBirthdays(birthdaysData.value?.results ?? []);
            setTodayBirthdays(birthdaysData.value?.today ?? []);
          }
        }
      } catch {
        if (isMounted) setFamily(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const coverUrl = useMemo(
    () => resolveMediaUrl(family?.cover_image),
    [family?.cover_image]
  );
  const logoUrl = useMemo(
    () => resolveMediaUrl(family?.logo),
    [family?.logo]
  );
  const familyInitial = family?.name?.trim()?.[0]?.toUpperCase() || "?";

  const isOwnerOrAdmin = useMemo(() => {
    if (!family || !user) return false;
    return (
      family.owner_id === user.id ||
      family.created_by === user.id ||
      user.role === "admin" ||
      family.user_role === "admin" ||
      family.user_role === "owner"
    );
  }, [family, user]);

  async function copyInviteCode() {
    if (!family?.family_code) return;

    try {
      await navigator.clipboard.writeText(family.family_code);
      setCopied(true);
      toast.success("Invite code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — try selecting the code manually.");
    }
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Workspace Intelligence Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 fill-brand-600 animate-pulse" />
              Workspace Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              Welcome back, {user?.first_name || "Member"}
              <span className="text-xl inline-block hover:scale-125 transition-transform duration-200 cursor-pointer">
                👋🏻
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/posts")}
              className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Family Feed</span>
            </button>
          </div>
        </div>

        {/* Celebration Banner */}
        {!loading && todayBirthdays.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-brand-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-white/20 transition-all hover:shadow-xl">
            <SubtleParticleCanvas />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 text-center sm:text-left">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner border border-white/30 animate-pulse">
                    🎂
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-300 rounded-full ring-2 ring-brand-700 animate-ping" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full mb-1.5 border border-white/20">
                    <Sparkles
                      className="w-3 h-3 text-yellow-300 animate-spin"
                      style={{ animationDuration: "4s" }}
                    />{" "}
                    Celebration Today! 🎉
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm text-white">
                    Happy Birthday, {todayBirthdays.map((b) => b.member).join(" & ")}!
                  </h2>
                  <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                    Wish them a wonderful day in the family workspace!
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/posts")}
                type="button"
                className="group shrink-0 inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-900 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 active:scale-95 text-xs tracking-wide cursor-pointer"
              >
                <span>Send Birthday Wishes</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm h-64" />
          </div>
        )}

        {/* Workspace Card & Modules */}
        {!loading && family && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Cover Banner Image with Preview Trigger */}
              <div 
                onClick={() => coverUrl && setPreviewImage({ url: coverUrl, title: `${family.name} Cover Image` })}
                className={`relative w-full h-48 sm:h-64 md:h-72 bg-stone-900 overflow-hidden group ${coverUrl ? "cursor-pointer" : ""}`}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${family.name} cover`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 block"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-brand-600 via-brand-700 to-stone-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="px-5 sm:px-8 pb-6 sm:pb-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 -mt-12 sm:-mt-16 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    
                    {/* Logo Image with Preview Trigger */}
                    <div className="relative shrink-0">
                      {logoUrl ? (
                        <img
                          onClick={() => setPreviewImage({ url: logoUrl, title: `${family.name} Logo` })}
                          src={logoUrl}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white hover:scale-105 transition-transform duration-300 cursor-pointer"
                          alt={`${family.name} logo`}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brand-600 ring-4 ring-white shadow-md flex items-center justify-center text-white text-3xl sm:text-4xl font-black select-none hover:scale-105 transition-transform duration-300">
                          {familyInitial}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 sm:pt-16 space-y-2 max-w-2xl">
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                          {family.name}
                        </h2>

                        <span
                          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                            family.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              family.is_active ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            }`}
                          />
                          {family.is_active ? "Active Workspace" : "Inactive Workspace"}
                        </span>
                      </div>

                      <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                        {family.description || "No workspace description provided yet."}
                      </p>
                    </div>
                  </div>

                  {/* Code Button Wrapper with Pushed Down Spacing */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto pt-4 lg:pt-20 shrink-0">
                    <button
                      onClick={copyInviteCode}
                      type="button"
                      className="mt-1 sm:mt-0 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-95 text-xs cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <CopyCheck size={16} className="text-white" />
                          <span>Code Copied</span>
                          <span className="text-xs">✓</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Code:</span>
                          <span className="font-mono tracking-wide">{family.family_code}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-stone-100">
                  <div
                    onClick={() => navigate("/posts")}
                    className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5 hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Total Posts</div>
                      <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {stats?.posts ?? 0}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => navigate("/posts")}
                    className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5 hover:border-indigo-400 hover:bg-white hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Photos</div>
                      <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {stats?.photos ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5 hover:border-amber-400 hover:bg-white hover:shadow-md transition-all duration-200 group">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Space Status</div>
                      <div className="text-base sm:text-lg font-bold text-stone-900 mt-0.5 flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            family.is_active ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          }`}
                        />
                        {family.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={() => navigate("/posts")}
                type="button"
                className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                    Family Posts
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                    Share messages, announcements, and wishes in the family feed.
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/posts/my-posts")}
                type="button"
                className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                    My Published Posts
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                    Manage and edit posts published by your user account.
                  </p>
                </div>
              </button>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate("/families/settings")}
                  type="button"
                  className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                      <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                      Workspace Settings
                      <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </h3>
                    <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                      Update family metadata, cover banner graphic, and controls.
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Bottom Panel: Scrollable Activity & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Short & Scrollable Recent Family Activity Card (Scrollbar Hidden) */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-600 animate-pulse" />
                    Recent Activity
                  </h3>
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                    Live
                  </span>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">
                    No recent activity recorded yet.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2.5">
                    {activities.map((act, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 bg-stone-50/70 hover:bg-stone-100/80 p-2.5 rounded-xl border border-stone-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                          <p className="text-xs text-stone-800 truncate">
                            <span className="font-semibold text-stone-900">{act.actor}</span>{" "}
                            <span className="text-stone-600">{act.action}</span>
                          </p>
                        </div>

                        <span className="text-[10px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatShortTime(act.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events & Birthdays Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Upcoming Events
                  </h3>

                  {events.length === 0 ? (
                    <p className="text-sm text-stone-500 py-4 text-center">
                      No upcoming events scheduled.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {events.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{evt.title}</p>
                              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                                {evt.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Cake className="w-5 h-5 text-rose-500 animate-bounce" />
                    Upcoming Birthdays
                  </h3>

                  {birthdays.length === 0 ? (
                    <p className="text-sm text-stone-500 py-4 text-center">
                      No upcoming birthdays soon.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {birthdays.map((bday, index) => (
                        <div
                          key={index}
                          className="p-3.5 bg-rose-50/50 border border-rose-200/60 rounded-2xl flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl relative">
                              <Cake className="w-4 h-4" />
                              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 border border-white" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{bday.member}</p>
                              <p className="text-xs text-rose-700 font-semibold mt-0.5">
                                {bday.birthday}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !family && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm text-center px-6 py-16 sm:py-20 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner animate-pulse">
              <Building2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              No Active Family Group
            </h2>

            <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
              You aren't currently assigned to a family workspace. Get started by creating a new family hub or joining an existing one.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
              <button
                onClick={() => navigate("/families/create")}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Workspace</span>
              </button>

              <button
                onClick={() => navigate("/families/join")}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs cursor-pointer"
              >
                <UserPlus size={16} className="text-stone-500" />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-white/10"
          >
            <button
              onClick={() => setPreviewImage(null)}
              type="button"
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X size={20} />
            </button>

            <div className="w-full h-full p-2 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              />
            </div>

            {previewImage.title && (
              <div className="w-full py-3 px-6 bg-stone-900/90 border-t border-white/10 text-center">
                <p className="text-xs font-semibold text-stone-300">{previewImage.title}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}