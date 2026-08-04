import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Camera, Loader2, X } from "lucide-react";
import * as authApi from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import { resolveMediaUrl } from "../utils/media";

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setUser } = useAuth(); // if your AuthContext doesn't expose setUser, see note below

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
    date_of_birth: "",
    gender: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    authApi
      .getProfile()
      .then((data) => {
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phone_number: data.phone_number ?? "",
          bio: data.bio ?? "",
          date_of_birth: data.date_of_birth ?? "",
          gender: data.gender ?? "",
        });
        setPhotoPreview(resolveMediaUrl(data.profile_photo));
      })
      .catch(() => toast.error("Couldn't load your profile."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  }

  function handleRemovePhoto(e) {
    e.stopPropagation(); // don't trigger the file picker underneath
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    if (form.phone_number) formData.append("phone_number", form.phone_number);
    formData.append("bio", form.bio);
    if (form.date_of_birth) formData.append("date_of_birth", form.date_of_birth);
    if (form.gender) formData.append("gender", form.gender);

    if (photoFile) {
      formData.append("profile_photo", photoFile);
    } else if (removePhoto) {
      // Standard way to clear a file field via multipart. If your backend
      // doesn't clear it from this, see the note below the code block.
      formData.append("profile_photo", "");
    }

    try {
      const updated = await authApi.updateProfile(formData);
      setUser?.(updated); // update the header/avatar instantly if AuthContext exposes this
      toast.success("Profile updated!");
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setErrors(data || {});
      toast.error(data?.detail || "Couldn't save your profile — check the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse space-y-4">
            <div className="h-20 w-20 rounded-full bg-stone-200 mx-auto" />
            <div className="h-4 w-32 bg-stone-200 rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="px-4 py-10">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="flex flex-col items-center mb-6">
            <div className="h-11 w-11 rounded-xl bg-brand-500 flex items-center justify-center text-white mb-3">
              <User size={22} />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Edit your profile</h1>
            <p className="text-sm text-stone-500 mt-1 text-center">
              Update your personal details.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-5"
          >
            {/* Profile photo */}
            <div className="flex flex-col items-center gap-2">
              <label className="relative cursor-pointer group">
                <div
                  className="h-20 w-20 rounded-full border-2 border-stone-200 bg-stone-100 bg-cover bg-center flex items-center justify-center overflow-hidden"
                  style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
                >
                  {!photoPreview && <User size={28} className="text-stone-400" />}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={18} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                )}
              </label>
              <span className="text-xs text-stone-400">
                {photoPreview ? "Click photo to change, or × to remove" : "Click to add a photo"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                First name
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {errors.first_name && (
                  <span className="text-xs text-red-600">{errors.first_name[0]}</span>
                )}
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                Last name
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {errors.last_name && (
                  <span className="text-xs text-red-600">{errors.last_name[0]}</span>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Phone number
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="9876543210"
                className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {errors.phone_number && (
                <span className="text-xs text-red-600">{errors.phone_number[0]}</span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                Date of birth
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {errors.date_of_birth && (
                  <span className="text-xs text-red-600">{errors.date_of_birth[0]}</span>
                )}
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                Gender
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Bio <span className="text-stone-400 font-normal">(optional)</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="A little about you…"
                className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}