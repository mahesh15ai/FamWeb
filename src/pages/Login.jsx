import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Users, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track field touch/interaction states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation regex helpers
  const validateEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // Field status states
  const isEmailDirty = email.length > 0;
  const isEmailValid = validateEmail(email);
  const showEmailError = emailTouched && isEmailDirty && !isEmailValid;
  const showEmailSuccess = isEmailDirty && isEmailValid;

  const isPasswordDirty = password.length > 0;
  const isPasswordValid = password.length >= 8;
  const showPasswordError = passwordTouched && isPasswordDirty && !isPasswordValid;

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (isEmailDirty && !isEmailValid) {
      toast.error("Please enter a valid email address.");
    }
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (isPasswordDirty && !isPasswordValid) {
      toast.error("Password must be at least 8 characters long.");
    }
  };

  const validateForm = () => {
    const trimmedEmail = email.trim();

    // 1. Check empty email
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return false;
    }

    // 2. Check valid email format
    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address (e.g., name@domain.com).");
      return false;
    }

    // 3. Check empty password
    if (!password) {
      toast.error("Please enter your password.");
      return false;
    }

    // 4. Check minimum password length
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }

    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Mark all as touched on submit attempt
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user?.first_name || "User"}!`);
      navigate("/dashboard");
    } catch (err) {
      // Extract backend validation error messages gracefully
      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        "Invalid email or password. Please try again.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-3">
            <Users size={22} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Log in to FamilyHub</h1>
          <p className="text-sm text-stone-500 mt-1">Welcome back — enter your details below.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-4"
        >
          {/* EMAIL INPUT FIELD */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Email Address
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="you@example.com"
                className={`w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-stone-100 disabled:cursor-not-allowed ${
                  showEmailError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : showEmailSuccess
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200"
                    : "border-stone-300 focus:border-brand-500 focus:ring-brand-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {showEmailSuccess && <CheckCircle2 size={16} className="text-emerald-500" />}
                {showEmailError && <AlertCircle size={16} className="text-red-500" />}
              </div>
            </div>
            {showEmailError && (
              <span className="text-xs text-red-500 font-normal">Please enter a valid email address.</span>
            )}
          </label>

          {/* PASSWORD INPUT FIELD */}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            <div className="flex items-center justify-between">
              <span>Password</span>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                placeholder="••••••••"
                className={`w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-stone-100 disabled:cursor-not-allowed ${
                  showPasswordError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-stone-300 focus:border-brand-500 focus:ring-brand-500"
                }`}
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showPasswordError && (
              <span className="text-xs text-red-500 font-normal">Password must be at least 8 characters.</span>
            )}
          </label>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogIn size={16} />
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>

          <p className="text-sm text-stone-600 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}