import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Copy,
  CopyCheck,
  Users,
  UserPlus,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Building2,
  Inbox,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as familiesApi from "../api/families";
import * as membershipApi from "../api/membership";
import Navbar from "../components/Navbar";
import { resolveMediaUrl } from "../utils/media";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [family, setFamily] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    familiesApi
      .getMyFamily()
      .then(async (data) => {
        if (!mounted) return;
        setFamily(data);

        if (data) {
          try {
            const members = await membershipApi.listMembers();
            if (mounted) setMemberCount(members.length);
          } catch {
            if (mounted) setMemberCount(null);
          }
        }
      })
      .catch(() => mounted && setFamily(null))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const coverUrl = resolveMediaUrl(family?.cover_image);
  const logoUrl = resolveMediaUrl(family?.logo);
  const familyInitial = family?.name?.trim()?.[0]?.toUpperCase() || "?";

  // Role verification helper
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
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              Welcome back, {user?.first_name || "Member"}
              <span className="text-xl">👋🏻</span>
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm max-w-sm">
            {family
              ? "Access your family network, members, and workspace settings."
              : "Set up or join a family space to begin collaborating."}
          </p>
        </div>

        {/* Responsive Skeleton Loader */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="h-48 sm:h-64 bg-stone-200" />
              <div className="p-6 sm:p-8 space-y-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-stone-300 -mt-16 border-4 border-white" />
                <div className="h-7 bg-stone-200 rounded w-1/3" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Active Family Card */}
        {!loading && family && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
              
              {/* Cover Image Banner */}
              <div className="relative w-full h-48 sm:h-64 md:h-80 bg-stone-900 overflow-hidden">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${family.name} cover`}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-brand-600 via-brand-700 to-stone-800" />
                )}
              </div>

              {/* Profile Details Container */}
              <div className="px-5 sm:px-8 pb-6 sm:pb-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 -mt-12 sm:-mt-16">
                  
                  {/* Logo Avatar & Workspace Meta */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    {/* Logo Avatar */}
                    <div className="relative shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                          alt={`${family.name} logo`}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brand-600 ring-4 ring-white shadow-md flex items-center justify-center text-white text-3xl sm:text-4xl font-black select-none">
                          {familyInitial}
                        </div>
                      )}
                    </div>

                    {/* Name & Bio */}
                    <div className="pt-2 sm:pt-16 space-y-2 max-w-2xl">
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                          {family.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                            family.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {family.is_active ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {family.is_active ? "Active Workspace" : "Inactive Workspace"}
                        </span>
                      </div>

                      <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                        {family.description || "No workspace description provided yet."}
                      </p>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto pt-2 lg:pt-16 shrink-0">
                    <button
                      onClick={copyInviteCode}
                      type="button"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98] text-sm"
                    >
                      {copied ? (
                        <>
                          <CopyCheck size={18} className="text-white" />
                          <span>Code Copied</span>
                          <span className="text-xs">✓</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          <span>Code:</span>
                          <span className="font-mono tracking-wide">{family.family_code}</span>
                        </>
                      )}
                    </button>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => navigate("/families/join-requests")}
                        type="button"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] text-sm"
                      >
                        <Inbox className="w-4 h-4 text-stone-500" />
                        <span>Join Requests</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics & Quick Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-stone-100">
                  <div className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Total Members</div>
                      <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {memberCount === null ? "–" : memberCount}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50/80 border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Space Status</div>
                      <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {family.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Join Requests (Admins/Owners only) */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate("/families/join-requests")}
                  type="button"
                  className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                      Join Requests
                      <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </h3>
                    <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                      Review, approve, or reject pending family membership requests.
                    </p>
                  </div>
                </button>
              )}

              {/* Family Directory Card */}
              <button
                onClick={() => navigate("/families/members")}
                type="button"
                className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                    Family Directory
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                    View active member roles, profiles, and permissions.
                  </p>
                </div>
              </button>

              {/* Family Settings Card (Admins/Owners only) */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate("/families/settings")}
                  type="button"
                  className="group relative bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 transition-colors mb-4">
                      <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
                      Workspace Settings
                      <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </h3>
                    <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                      Update family metadata, cover banner graphic, and controls.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State View */}
        {!loading && !family && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm text-center px-6 py-16 sm:py-20 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              No Active Family Group
            </h2>

            <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
              You aren&apos;t currently assigned to a family workspace. Get started by creating a new family hub or joining an existing one.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
              <button
                onClick={() => navigate("/families/create")}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] text-sm"
              >
                <Plus size={18} />
                <span>Create Workspace</span>
              </button>

              <button
                onClick={() => navigate("/families/join")}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] text-sm"
              >
                <UserPlus size={18} className="text-stone-500" />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}