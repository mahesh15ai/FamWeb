import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Shield,
  UserX,
  Sparkles,
  Loader2,
  Crown,
  Mail,
} from "lucide-react";
import * as membershipApi from "../api/membership";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function FamilyMembers() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const data = await membershipApi.listMembers();
      // Backend paginates: { count, results: [...] }. Unwrap it if present,
      // otherwise fall back to treating the response itself as the array.
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setMembers(list);
    } catch {
      toast.error("Failed to load family members.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(memberId, memberName) {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the family?`)) {
      return;
    }

    setRemovingId(memberId);
    try {
      if (membershipApi.removeMember) {
        await membershipApi.removeMember(memberId);
      }
      toast.success(`${memberName} has been removed.`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not remove member.");
    } finally {
      setRemovingId(null);
    }
  }

  /**
   * The membership serializer returns flat fields — user_email, user_full_name —
   * not a nested user object. `member.user` is just the plain user ID.
   */
  function getMemberInfo(member) {
    const name =
      member.user_full_name?.trim() || member.user_email?.split("@")[0] || "Family Member";
    const email = member.user_email || "No email available";
    const role = member.role || "Member";
    const initial = name[0]?.toUpperCase() || "?";

    return { name, email, role, initial, userId: member.user };
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Back Navigation */}
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            type="button"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
              Family Members
              <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                {members.length}
              </span>
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm max-w-xs">
            View active member accounts, roles, and connected profiles.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className="w-10 h-10 rounded-xl bg-stone-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-stone-200 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && members.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm text-center px-6 py-16 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900">
                No Members Found
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto">
                No members were returned from your family workspace. Try refreshing or inviting members.
              </p>
            </div>
          </div>
        )}

        {/* Active Members List */}
        {!loading && members.length > 0 && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden divide-y divide-stone-100">
            {members.map((member) => {
              const { name, email, role, initial, userId } = getMemberInfo(member);
              const isOwner = role.toUpperCase() === "OWNER" || role.toUpperCase() === "ADMIN";
              const isSelf = currentUser?.id === userId || currentUser?.email === email;

              return (
                <div
                  key={member.id || userId || email}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  {/* Member Meta */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-base shrink-0 border border-brand-200/50">
                      {initial}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-stone-900 text-sm sm:text-base leading-tight truncate">
                          {name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            You
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 font-medium flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Role Badge & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                        isOwner
                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                          : "bg-stone-100 text-stone-700 border border-stone-200/80"
                      }`}
                    >
                      {isOwner ? (
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-stone-400" />
                      )}
                      <span className="capitalize">{role.toLowerCase()}</span>
                    </span>

                    {/* Optional Remove Button for non-owners */}
                    {!isSelf && !isOwner && membershipApi.removeMember && (
                      <button
                        onClick={() => handleRemoveMember(member.id, name)}
                        disabled={removingId === member.id}
                        type="button"
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        {removingId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}