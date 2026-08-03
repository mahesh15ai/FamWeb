import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Clock } from "lucide-react";
import * as joinRequestsApi from "../api/joinRequests";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function ManageJoinRequests() {
  const navigate = useNavigate();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOnId, setActingOnId] = useState(null);

  function loadRequests() {
    setLoading(true);
    joinRequestsApi
      .listJoinRequests()
      .then(setRequests)
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Couldn't load join requests.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleApprove(id) {
    setActingOnId(id);
    try {
      await joinRequestsApi.approveJoinRequest(id);
      toast.success("Request approved — they're now a member.");
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't approve request.");
    } finally {
      setActingOnId(null);
    }
  }

  async function handleReject(id) {
    setActingOnId(id);
    try {
      await joinRequestsApi.rejectJoinRequest(id);
      toast.info("Request rejected.");
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't reject request.");
    } finally {
      setActingOnId(null);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-1">Join requests</h1>
        <p className="text-sm text-stone-500 mb-8">Approve or reject people asking to join your family.</p>

        {loading && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
            <div className="h-4 w-40 bg-stone-200 rounded mb-3" />
            <div className="h-3 w-28 bg-stone-200 rounded" />
          </div>
        )}

        {!loading && pending.length === 0 && decided.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
            No join requests yet.
          </div>
        )}

        {!loading && pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Pending ({pending.length})
            </h2>
            <div className="flex flex-col gap-3">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{r.user_full_name}</p>
                    <p className="text-sm text-stone-500">{r.user_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={actingOnId === r.id}
                      className="flex items-center gap-1.5 text-sm font-semibold bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={actingOnId === r.id}
                      className="flex items-center gap-1.5 text-sm font-semibold border border-stone-300 text-stone-600 rounded-lg px-3 py-1.5 hover:bg-stone-100 transition-colors disabled:opacity-60"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && decided.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              History
            </h2>
            <div className="flex flex-col gap-2">
              {decided.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-stone-400" />
                    <span className="text-sm text-stone-700">{r.user_full_name}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}