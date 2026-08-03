import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ImagePlus, ArrowLeft } from "lucide-react";
import * as familiesApi from "../api/families";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function CreateFamily() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", description: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(previewUrl);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", form.name);
    if (form.description) formData.append("description", form.description);
    if (logoFile) formData.append("logo", logoFile);
    if (coverFile) formData.append("cover_image", coverFile);

    try {
      const family = await familiesApi.createFamily(formData);
      toast.success(`"${family.name}" created! Invite code: ${family.family_code}`);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.detail ? { name: [data.detail] } : data || { name: ["Something went wrong."] });
      toast.error(data?.detail || "Couldn't create family — check the form.");
    } finally {
      setIsSubmitting(false);
    }
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
              <Users size={22} />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Create your family</h1>
            <p className="text-sm text-stone-500 mt-1 text-center">
              You'll get a shareable invite code once it's created.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-5"
          >
            <label className="block">
              <div
                className="h-32 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand-400 transition-colors"
                style={
                  coverPreview
                    ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!coverPreview && (
                  <span className="flex flex-col items-center gap-1 text-stone-400 text-xs">
                    <ImagePlus size={20} />
                    Cover image (optional)
                  </span>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "cover")} />
            </label>

            <div className="flex items-center gap-4">
              <label className="shrink-0">
                <div
                  className="h-16 w-16 rounded-full border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand-400 transition-colors"
                  style={
                    logoPreview
                      ? { backgroundImage: `url(${logoPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {!logoPreview && <ImagePlus size={16} className="text-stone-400" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
              </label>

              <label className="flex-1 flex flex-col gap-1.5 text-sm font-medium text-stone-700">
                Family name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Gomaskar Family"
                  className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {errors.name && <span className="text-xs text-red-600">{errors.name[0]}</span>}
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
              Description <span className="text-stone-400 font-normal">(optional)</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="A short note about your family…"
                className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-500 text-white font-semibold py-2.5 text-sm hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating…" : "Create family"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}   