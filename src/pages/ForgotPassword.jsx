import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import * as authApi from "../api/auth";
import { useToast } from "../context/ToastContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(email.trim());
      toast.success("If that email is registered, a reset code has been sent.");
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const data = err.response?.data;
      const message = data?.email?.[0] || data?.detail || "Something went wrong. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-3">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-stone-500 mt-1 text-center">
            Enter your account email and we'll send you a reset code.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-5"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Email address
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      </div>
    </div>
  );
}