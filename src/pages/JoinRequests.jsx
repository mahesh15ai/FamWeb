import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  Sparkles,
  Clock,
  Inbox,
} from "lucide-react";
import * as joinRequestsApi from "../api/joinRequests";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function JoinRequests() {
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchJoinRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchJoinRequests() {
    setLoading(true);
    try {
      const data = await joinRequestsApi.listJoinRequests();
      const pendingOnly = Array.isArray(data)
        ? data.filter((req) => req.status === "PENDING" || !req.status)
        : [];
      setRequests(pendingOnly);
    } catch {
      toast.error("Couldn't load pending join requests.");
    } finally { // Fixed syntax here
      setLoading(false);
    }
  }

  async function handleApprove(requestId) {
    setActionId(requestId);
    setActionType("approve");
    try {
      await joinRequestsApi.approveJoinRequest(requestId);
      toast.success("Request approved! Member added to family.");
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to approve request.";
      toast.error(message);
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  async function handleReject(requestId) {
    setActionId(requestId);
    setActionType("reject");
    try {
      await joinRequestsApi.rejectJoinRequest(requestId);
      toast.info("Request rejected.");
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to reject request.";
      toast.error(message);
    } finally {
      setActionId(null);
      setActionType(null);
    }
  }

  function getUserDisplayName(req) {
    if (req.user_first_name || req.user_last_name) {
      return `${req.user_first_name ?? ""} ${req.user_last_name ?? ""}`.trim();
    }
    if (req.user?.first_name || req.user?.last_name) {
      return `${req.user.first_name ?? ""} ${req.user.last_name ?? ""}`.trim();
    }
    if (req.user_name || req.user?.name || req.full_name) {
      return req.user_name || req.user?.name || req.full_name;
    }
    if (req.username || req.user?.username) {
      return req.username || req.user?.username;
    }
    const email = req.user_email || req.user?.email || req.email;
    if (email) {
      return email.split("@")[0];
    }
    return "Family Member";
  }

  function getUserEmail(req) {
    return req.user_email || req.user?.email || req.email || "No email provided";
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              Incoming Join Requests
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm max-w-xs">
            Review pending access requests from members wanting to join your family.
          </p>
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200/80 p-5 h-20 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <div className="w-10 h-10 rounded-xl bg-stone-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-20 h-9 bg-stone-200 rounded-xl" />
                  <div className="w-20 h-9 bg-stone-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm text-center px-6 py-16 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Inbox className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900">
                No Pending Requests
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto">
                All caught up! When users submit your invite code, their requests will appear here.
              </p>
            </div>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden divide-y divide-stone-100">
            {requests.map((req) => {
              const isProcessing = actionId === req.id;
              const displayName = getUserDisplayName(req);
              const email = getUserEmail(req);
              const initial = displayName[0]?.toUpperCase() || "?";

              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-base shrink-0 border border-brand-200/50">
                      {initial}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight">
                        {displayName}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">
                        {email}
                      </p>
                      {req.created_at && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-400 pt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            Requested {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isProcessing}
                      type="button"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing && actionType === "approve" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={isProcessing}
                      type="button"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-stone-300 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-stone-700 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing && actionType === "reject" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-stone-400 group-hover:text-red-600" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
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