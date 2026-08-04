import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import * as authApi from "../api/auth";
import { useToast } from "../context/ToastContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    email: searchParams.get("email") ?? "",
    otp: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    if (form.new_password !== form.confirm_password) {
      setErrors({ confirm_password: ["Passwords don't match."] });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        email: form.email.trim(),
        otp: form.otp.trim(),
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      toast.success("Password reset successfully. You can now log in.");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setErrors(data || { otp: ["Something went wrong. Please try again."] });
      toast.error(data?.detail || "Couldn't reset your password — check the code and try again.");
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
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Reset your password</h1>
          <p className="text-sm text-stone-500 mt-1 text-center">
            Enter the code we sent you, along with your new password.
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
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            {errors.email && <span className="text-xs text-red-600">{errors.email[0]}</span>}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            6-digit reset code
            <input
              name="otp"
              value={form.otp}
              onChange={handleChange}
              required
              maxLength={6}
              inputMode="numeric"
              placeholder="123456"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-mono tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {errors.otp && <span className="text-xs text-red-600">{errors.otp[0]}</span>}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            New password
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            {errors.new_password && (
              <span className="text-xs text-red-600">{errors.new_password[0]}</span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Confirm new password
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            {errors.confirm_password && (
              <span className="text-xs text-red-600">{errors.confirm_password[0]}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}