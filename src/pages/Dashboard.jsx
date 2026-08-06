import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Copy,
  CopyCheck,
  Users,
  UserPlus,
  SlidersHorizontal,
  ArrowUpRight,
  Activity,
  Building2,
  Inbox,
  Calendar,
  Cake,
  FileText,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ChevronRight,
  Zap,
  GitFork,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as familiesApi from "../api/families";
import * as membershipApi from "../api/membership";
import * as dashboardApi from "../api/dashboard";
import Navbar from "../components/Navbar";
import { resolveMediaUrl } from "../utils/media";

function SubtleParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
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
          p.y = height + 10;
          p.x = Math.random() * width;
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
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
          const [members, statsData, activitiesData, eventsData, birthdaysData] =
            await Promise.allSettled([
              membershipApi.listMembers(),
              dashboardApi.getStatistics(),
              dashboardApi.getRecentActivities(),
              dashboardApi.getUpcomingEvents(),
              dashboardApi.getBirthdays(),
            ]);

          if (!isMounted) return;

          if (members.status === "fulfilled") {
            const list = Array.isArray(members.value)
              ? members.value
              : members.value?.results ?? [];
            setMemberCount(list.length);
          }

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

  const coverUrl = resolveMediaUrl(family?.cover_image);
  const logoUrl = resolveMediaUrl(family?.logo);
  const familyInitial = family?.name?.trim()?.[0]?.toUpperCase() || "?";

  const isOwnerOrAdmin =
    family?.owner_id === user?.id ||
    family?.created_by === user?.id ||
    user?.role === "admin" ||
    family?.user_role === "admin" ||
    family?.user_role === "owner";

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
        {/* Executive Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 fill-brand-600 animate-pulse" />
              Workspace Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              Welcome back, {user?.first_name || "Member"}
              <span className="text-xl inline-block hover:scale-125 transition-transform duration-200 cursor-pointer">👋🏻</span>
            </h1>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/posts")}
              className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Family Feed</span>
            </button>
            <button
              onClick={() => navigate("/families/tree")}
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors active:scale-95"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Family Tree</span>
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
                    <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" style={{ animationDuration: "4s" }} /> Celebration Today! 🎉
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

        {!loading && family && (
          <div className="space-y-8">
            {/* Main Family Banner Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative w-full h-48 sm:h-64 md:h-72 bg-stone-900 overflow-hidden group">
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
                    <div className="relative shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white hover:scale-105 transition-transform duration-300"
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

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto pt-2 lg:pt-16 shrink-0">
                    <button
                      onClick={copyInviteCode}
                      type="button"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-95 text-xs cursor-pointer"
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

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => navigate("/families/join-requests")}
                        type="button"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs cursor-pointer"
                      >
                        <Inbox className="w-4 h-4 text-stone-500" />
                        <span>Join Requests</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dashboard Interactive Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-stone-100">
                  <div
                    onClick={() => navigate("/families/members")}
                    className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5 hover:border-brand-400 hover:bg-white hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Total Members</div>
                      <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {memberCount ?? stats?.members ?? 0}
                      </div>
                    </div>
                  </div>

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

                  <div className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5 hover:border-indigo-400 hover:bg-white hover:shadow-md transition-all duration-200 group">
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

            {/* Quick Navigation Hub with Direct Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Link to Family Feed */}
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

              {/* Link to My Posts */}
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

              {/* Link to Family Tree */}
              <button
                onClick={() => navigate("/families/tree")}
                type="button"
                className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                    <GitFork className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                    Family Tree
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                    View family member connections and visual lineage graph.
                  </p>
                </div>
              </button>

              {/* Link to Member Directory */}
              <button
                onClick={() => navigate("/families/members")}
                type="button"
                className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                    Family Directory
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                    View active member roles, profiles, and permissions.
                  </p>
                </div>
              </button>

              {/* Link to Join Requests (Owner/Admin only) */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate("/families/join-requests")}
                  type="button"
                  className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-400 transition-all duration-300 text-left flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                      Join Requests
                      <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </h3>
                    <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                      Review, approve, or reject pending family membership requests.
                    </p>
                  </div>
                </button>
              )}

              {/* Link to Workspace Settings (Owner/Admin only) */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-600 animate-pulse" />
                    Recent Family Activity
                  </h3>
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                    Live Updates
                  </span>
                </div>

                {activities.length === 0 ? (
                  <p className="text-sm text-stone-500 py-6 text-center">
                    No recent activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4 pt-2">
                    {activities.map((act, index) => (
                      <div key={index} className="flex items-start gap-3 relative group">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 mt-1.5 ring-4 ring-brand-50 group-hover:scale-125 transition-transform" />
                        <div className="flex-1 min-w-0 bg-stone-50/60 rounded-xl p-3 border border-stone-100 group-hover:border-stone-200 group-hover:bg-white transition-all">
                          <p className="text-sm text-stone-900 leading-tight">
                            <span className="font-semibold">{act.actor}</span>{" "}
                            <span className="text-stone-600">{act.action}</span>
                          </p>
                          <p className="text-[11px] text-stone-400 mt-1.5 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
    </div>
  );
}