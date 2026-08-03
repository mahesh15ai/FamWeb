import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ArrowLeft, KeyRound, Loader2, Sparkles, Send } from "lucide-react";
import * as joinRequestsApi from "../api/joinRequests";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function JoinFamily() {
  const navigate = useNavigate();
  const toast = useToast();

  const [familyCode, setFamilyCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInputChange(e) {
    // Convert to uppercase and strip spaces in real-time
    const formattedCode = e.target.value.toUpperCase().replace(/\s+/g, "");
    setFamilyCode(formattedCode);
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!familyCode.trim()) return;

    setError("");
    setIsSubmitting(true);

    try {
      await joinRequestsApi.createJoinRequest(familyCode.trim());
      toast.success("Join request sent! Waiting for the family owner to approve.");
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.detail ||
        data?.family_code?.[0] ||
        "Couldn't submit request — please check the invite code.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-12">
      <Navbar />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Back Navigation Button */}
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

        {/* Card Form Container */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-stone-500 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Membership Request</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              Join a Family Space
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
              Enter the unique invite code shared with you by your family administrator.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="inviteCodeInput"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
              >
                Family Invite Code <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound size={18} />
                </div>
                <input
                  id="inviteCodeInput"
                  type="text"
                  value={familyCode}
                  onChange={handleInputChange}
                  required
                  maxLength={16}
                  placeholder="e.g. 8F3K9X2Q"
                  className={`w-full rounded-xl border pl-10 pr-4 py-3 text-base sm:text-lg font-mono font-bold tracking-widest text-center text-stone-900 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-stone-300 focus:ring-brand-500 focus:border-brand-500"
                  }`}
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-600 mt-1 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !familyCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Join Request</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}