import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, UserPlus, Users, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import * as authApi from "../api/auth";
import { useToast } from "../context/ToastContext";

const fieldClass =
  "w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-stone-400";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const validateEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // Real-time Email states
  const isEmailDirty = form.email.length > 0;
  const isEmailValid = validateEmail(form.email);
  const showEmailError = emailTouched && isEmailDirty && !isEmailValid;
  const showEmailSuccess = isEmailDirty && isEmailValid;

  // Real-time Confirm Password states
  const isConfirmDirty = form.confirm_password.length > 0;
  const isPasswordMatch = form.password && form.password === form.confirm_password;
  const showConfirmError = confirmPasswordTouched && isConfirmDirty && !isPasswordMatch;
  const showConfirmSuccess = isConfirmDirty && isPasswordMatch;

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (isEmailDirty && !isEmailValid) {
      toast.error("Please enter a valid email address.");
    }
  };

  const handleConfirmBlur = () => {
    setConfirmPasswordTouched(true);
    if (isConfirmDirty && !isPasswordMatch) {
      toast.error("Passwords do not match.");
    }
  };

  const validateForm = () => {
    const trimmedFirstName = form.first_name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedFirstName) {
      toast.error("Please enter your first name.");
      return false;
    }

    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return false;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (form.phone_number && !/^\+?[0-9\s-]{7,15}$/.test(form.phone_number.trim())) {
      toast.error("Please enter a valid phone number.");
      return false;
    }

    if (!form.password) {
      toast.error("Please enter a password.");
      return false;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }

    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return false;
    }

    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await authApi.register({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
      });
      toast.success("Account created! You can log in now.");
      navigate("/login");
    } catch (err) {
      const apiErrors = err.response?.data;
      let message = "Registration failed. Please try again.";

      if (typeof apiErrors === "object" && apiErrors !== null) {
        const firstKey = Object.keys(apiErrors)[0];
        if (Array.isArray(apiErrors[firstKey])) {
          message = apiErrors[firstKey][0];
        } else if (typeof apiErrors[firstKey] === "string") {
          message = apiErrors[firstKey];
        }
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-3">
            <Users size={22} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-stone-500 mt-1">Join FamilyHub in a few seconds.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              First name
              <div className="relative">
                <User size={16} className={iconClass} />
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Last name
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Email
            <div className="relative">
              <Mail size={16} className={iconClass} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                className={`w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                  showEmailError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : showEmailSuccess
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200"
                    : "border-stone-300 focus:border-brand-500 focus:ring-brand-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {showEmailSuccess && <CheckCircle2 size={16} className="text-emerald-500" />}
                {showEmailError && <AlertCircle size={16} className="text-red-500" />}
              </div>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Phone number
            <div className="relative">
              <Phone size={16} className={iconClass} />
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Password
            <div className="relative">
              <Lock size={16} className={iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-stone-300 pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
            Confirm password
            <div className="relative">
              <Lock size={16} className={iconClass} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                onBlur={handleConfirmBlur}
                className={`w-full rounded-lg border pl-9 pr-16 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                  showConfirmError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : showConfirmSuccess
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200"
                    : "border-stone-300 focus:border-brand-500 focus:ring-brand-500"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {showConfirmSuccess && <CheckCircle2 size={16} className="text-emerald-500" />}
                {showConfirmError && <AlertCircle size={16} className="text-red-500" />}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-stone-400 hover:text-stone-600 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-sm text-stone-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}