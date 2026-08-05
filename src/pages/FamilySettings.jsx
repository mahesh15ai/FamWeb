import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ImagePlus,
  ArrowLeft,
  Trash2,
  Copy,
  CopyCheck,
  Loader2,
  Sparkles,
  AlertTriangle,
  X,
  Upload,
} from "lucide-react";
import * as familiesApi from "../api/families";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import RepositionableCover from "../components/RepositionableCover";
import { resolveMediaUrl } from "../utils/media";

export default function FamilySettings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", description: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    familiesApi
      .getMyFamily()
      .then((data) => {
        if (!isMounted) return;
        setFamily(data);
        setForm({ name: data.name ?? "", description: data.description ?? "" });
        setLogoPreview(resolveMediaUrl(data.logo));
        setCoverPreview(resolveMediaUrl(data.cover_image));
        setCoverPositionY(data.cover_position_y ?? 50);
      })
      .catch(() => {
        if (isMounted) {
          toast.error("Couldn't load your family details.");
          navigate("/dashboard");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  }

  function handleFileChange(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(previewUrl);
      setCoverPositionY(50);
    }
  }

  function clearFile(type) {
    if (type === "logo") {
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      setCoverFile(null);
      setCoverPreview(null);
      setCoverPositionY(50);
    }
  }

  async function copyInviteCode() {
    if (!family?.family_code) return;
    try {
      await navigator.clipboard.writeText(family.family_code);
      setCopied(true);
      toast.success("Invite code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("cover_position_y", coverPositionY);
    if (logoFile) formData.append("logo", logoFile);
    if (coverFile) formData.append("cover_image", coverFile);

    try {
      await familiesApi.updateFamily(family.id, formData);
      toast.success("Family settings updated!");
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setErrors(
        data?.detail
          ? { name: [data.detail] }
          : data || { name: ["Something went wrong saving settings."] }
      );
      toast.error(data?.detail || "Couldn't save changes — please check the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await familiesApi.deleteFamily(family.id);
      toast.success("Family space permanently deleted.");
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || "Couldn't delete family space.");
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100/70 antialiased">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-8 animate-pulse space-y-6">
            <div className="h-6 w-36 bg-stone-200 rounded" />
            <div className="h-44 bg-stone-200 rounded-2xl" />
            <div className="h-10 bg-stone-200 rounded-xl" />
            <div className="h-24 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-16">
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
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs sm:text-sm font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Workspace Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mt-0.5">
              Family Settings
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm max-w-xs">
            Manage your family's public branding, details, and access security.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-8 space-y-6"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider">
                Cover Image
              </label>
              {coverPreview && (
                <span className="text-[11px] text-stone-400 font-medium">
                  Drag the image to adjust its position
                </span>
              )}
            </div>

            <div className="relative group rounded-2xl border-2 border-dashed border-stone-300 hover:border-brand-500 bg-stone-50 overflow-hidden transition-all duration-200">
              {coverPreview ? (
                <div className="relative">
                  <RepositionableCover
                    imageUrl={coverPreview}
                    positionY={coverPositionY}
                    onPositionChange={setCoverPositionY}
                  />

                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer bg-white/90 hover:bg-white text-stone-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md transition-transform active:scale-95">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "cover")}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => clearFile("cover")}
                      className="bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-xl shadow-md transition-transform active:scale-95"
                      title="Remove cover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-40 sm:h-52 w-full flex items-center justify-center">
                  <label className="flex flex-col items-center justify-center cursor-pointer p-6 text-stone-400 hover:text-stone-600 transition-colors">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Upload Cover Graphic</span>
                    <span className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "cover")}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start pt-2">
            <div className="sm:col-span-4 space-y-2 flex flex-col items-center sm:items-start">
              <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider">
                Family Logo
              </label>

              <div className="relative group shrink-0">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-stone-300 hover:border-brand-500 bg-stone-50 overflow-hidden flex items-center justify-center transition-all bg-cover bg-center"
                  style={
                    logoPreview
                      ? { backgroundImage: `url(${logoPreview})` }
                      : undefined
                  }
                >
                  {!logoPreview && (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-stone-400 hover:text-stone-600">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-[11px] font-semibold">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "logo")}
                      />
                    </label>
                  )}

                  {logoPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer bg-white text-stone-900 p-2 rounded-xl shadow-sm hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, "logo")}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => clearFile("logo")}
                        className="bg-red-600 text-white p-2 rounded-xl shadow-sm hover:scale-105 transition-transform"
                        title="Remove Logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-8 space-y-2">
              <label
                htmlFor="familyNameInput"
                className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider"
              >
                Family Name <span className="text-red-500">*</span>
              </label>

              <input
                id="familyNameInput"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Smith Family"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:font-normal placeholder:text-stone-400"
              />
              {errors.name && (
                <p className="text-xs font-semibold text-red-600 mt-1">{errors.name[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="familyDescInput"
                className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider"
              >
                Description
              </label>
              <span className="text-xs text-stone-400 font-medium">
                {form.description.length}/250
              </span>
            </div>

            <textarea
              id="familyDescInput"
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={250}
              rows={3}
              placeholder="Share a short note about your family, traditions, or shared workspace purpose..."
              className="w-full rounded-xl border border-stone-300 p-4 text-sm font-medium text-stone-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:font-normal placeholder:text-stone-400"
            />
          </div>

          <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Family Join Code
              </p>
              <p className="text-sm font-mono font-bold text-stone-900 mt-0.5 tracking-wider">
                {family?.family_code || "—"}
              </p>
            </div>

            <button
              type="button"
              onClick={copyInviteCode}
              className="inline-flex items-center justify-center gap-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all duration-150 active:scale-95"
            >
              {copied ? (
                <>
                  <CopyCheck className="w-4 h-4 text-emerald-600" />
                  <span>Code Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-3xl border border-red-200/80 shadow-sm p-5 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <h2>Danger Zone</h2>
          </div>

          <p className="text-stone-600 text-sm leading-relaxed">
            Deleting your family workspace will permanently remove all member access, join requests, and profile data. This operation cannot be reversed.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-100/70 rounded-xl px-4 py-2.5 transition-all duration-150 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Delete Family Workspace
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
              <p className="text-sm font-bold text-red-900">
                Are you completely sure? This action is permanent.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Permanently Delete</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl px-4 py-2.5 transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}