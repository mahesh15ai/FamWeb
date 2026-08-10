// src/pages/AlbumDetailPage.jsx

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  X,
  Plus,
  Loader2,
  Maximize2,
  Calendar,
  User,
  CheckSquare,
  Square,
  CheckCircle2,
  Download,
} from "lucide-react";
import { getAlbumById } from "../api/albumService";
import {
  getPhotosByAlbum,
  uploadPhotos,
  deletePhoto,
  deleteMultiplePhotos,
  downloadSinglePhoto,
} from "../api/photoService";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function AlbumDetailPage() {
  const { id: albumId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-Selection State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Lightbox State
  const [activePhoto, setActivePhoto] = useState(null);

  // Load Album and Photos
  const fetchData = async () => {
    try {
      setLoading(true);
      const [albumData, photosData] = await Promise.all([
        getAlbumById(albumId),
        getPhotosByAlbum(albumId),
      ]);
      setAlbum(albumData);
      setPhotos(photosData.results || []);
    } catch (err) {
      toast.error("Failed to load album details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchData();
  }, [albumId]);

  // Toggle Single Selection
  const toggleSelectPhoto = (photoId, e) => {
    if (e) e.stopPropagation();
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Select All / Deselect All
  const handleSelectAll = () => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map((p) => p.id));
    }
  };

  // Exit Select Mode
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedPhotoIds([]);
  };

  // Single Photo Download
  const handleDownloadPhoto = (photo, e) => {
    if (e) e.stopPropagation();
    const url = photo.image_url || photo.image;
    const filename = `photo_${photo.id}.jpg`;
    downloadSinglePhoto(url, filename);
    toast.success("Download started...");
  };

  // Bulk Download
  const handleBulkDownload = async () => {
    if (!selectedPhotoIds.length) return;
    try {
      setDownloadingBulk(true);
      toast.info(`Downloading ${selectedPhotoIds.length} photo(s)...`);

      const selectedPhotos = photos.filter((p) =>
        selectedPhotoIds.includes(p.id)
      );

      for (const p of selectedPhotos) {
        const url = p.image_url || p.image;
        await downloadSinglePhoto(url, `photo_${p.id}.jpg`);
      }
      toast.success("All selected photos downloaded!");
    } catch (err) {
      toast.error("Failed to download selected photos.");
    } finally {
      setDownloadingBulk(false);
    }
  };

  // Execute Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedPhotoIds.length) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedPhotoIds.length} photo(s)?`
      )
    )
      return;

    try {
      setDeletingBulk(true);
      await deleteMultiplePhotos(selectedPhotoIds);
      toast.success(`${selectedPhotoIds.length} photo(s) deleted.`);
      setPhotos((prev) => prev.filter((p) => !selectedPhotoIds.includes(p.id)));
      exitSelectMode();
    } catch (err) {
      toast.error("Failed to delete selected photos.");
    } finally {
      setDeletingBulk(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setShowUploadModal(true);
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) {
      toast.error("Please select at least one photo.");
      return;
    }

    try {
      setUploading(true);
      await uploadPhotos(albumId, selectedFiles, caption);
      toast.success(`${selectedFiles.length} photo(s) uploaded successfully!`);
      setSelectedFiles([]);
      setCaption("");
      setShowUploadModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to upload photos. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // Single Delete
  const handleDeletePhoto = async (photoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    try {
      await deletePhoto(photoId);
      toast.success("Photo deleted.");
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (activePhoto?.id === photoId) setActivePhoto(null);
    } catch (err) {
      toast.error("Failed to delete photo.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/albums")}
              className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-stone-900">
                {album?.title || "Loading Album..."}
              </h1>
              {album?.description && (
                <p className="text-xs text-stone-500 mt-1">{album.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-Selection Control Bar */}
            {photos.length > 0 && (
              <>
                {isSelectMode ? (
                  <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-stone-700 shadow-xs hover:bg-stone-50 cursor-pointer"
                    >
                      {selectedPhotoIds.length === photos.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>

                    {/* Bulk Download Button */}
                    <button
                      onClick={handleBulkDownload}
                      disabled={downloadingBulk || selectedPhotoIds.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      {downloadingBulk ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Download ({selectedPhotoIds.length})
                    </button>

                    {/* Bulk Delete Button */}
                    <button
                      onClick={handleBulkDelete}
                      disabled={deletingBulk || selectedPhotoIds.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      {deletingBulk ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Delete ({selectedPhotoIds.length})
                    </button>

                    <button
                      onClick={exitSelectMode}
                      className="p-1.5 text-stone-500 hover:text-stone-800 rounded-xl cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer"
                  >
                    <CheckSquare size={16} />
                    Select
                  </button>
                )}
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <UploadCloud size={16} />
              Upload Photos
            </button>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-stone-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <ImageIcon size={24} />
            </div>
            <h3 className="text-base font-bold text-stone-800">
              No Photos in this Album
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Start adding photos to this album by clicking the button below!
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 cursor-pointer"
            >
              <Plus size={14} /> Add Photos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => {
              const isSelected = selectedPhotoIds.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  onClick={(e) => {
                    if (isSelectMode) {
                      toggleSelectPhoto(photo.id, e);
                    } else {
                      setActivePhoto(photo);
                    }
                  }}
                  className={`group relative aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all border ${
                    isSelected
                      ? "ring-4 ring-brand-500 border-transparent scale-[0.98]"
                      : "border-stone-200/60"
                  }`}
                >
                  <img
                    src={photo.image_url || photo.image}
                    alt={photo.caption || "Album Photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Checkbox Overlay in Selection Mode */}
                  {isSelectMode && (
                    <div
                      onClick={(e) => toggleSelectPhoto(photo.id, e)}
                      className="absolute top-3 left-3 z-10"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-brand-600 fill-white" />
                      ) : (
                        <Square className="w-6 h-6 text-white/80 fill-black/30" />
                      )}
                    </div>
                  )}

                  {/* Standard Hover Overlay */}
                  {!isSelectMode && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={(e) => handleDownloadPhoto(photo, e)}
                          title="Download Photo"
                          className="p-1.5 bg-black/50 hover:bg-brand-600 text-white rounded-xl transition-colors cursor-pointer"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeletePhoto(photo.id, e)}
                          title="Delete Photo"
                          className="p-1.5 bg-black/50 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="text-white space-y-1">
                        {photo.caption && (
                          <p className="text-xs font-semibold line-clamp-1">
                            {photo.caption}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] text-stone-300">
                          <Maximize2 size={10} /> Click to Expand
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Upload {selectedFiles.length} Photo(s)
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-bold text-stone-700">
                  Selected Files:
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {selectedFiles.map((f, i) => (
                    <p key={i} className="text-[11px] text-stone-500 truncate">
                      📷 {f.name} ({Math.round(f.size / 1024)} KB)
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rudra cutting the cake 🎉"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload All"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10 cursor-default"
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="p-2 flex items-center justify-center bg-black/40 overflow-hidden">
              <img
                src={activePhoto.image_url || activePhoto.image}
                alt="Enlarged view"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </div>

            <div className="p-4 bg-stone-900/90 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
              <div>
                {activePhoto.caption && (
                  <p className="font-bold text-white text-sm">
                    {activePhoto.caption}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <User size={12} /> {activePhoto.uploaded_by_name || "Family Member"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />{" "}
                    {new Date(activePhoto.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownloadPhoto(activePhoto, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={(e) => handleDeletePhoto(activePhoto.id, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold cursor-pointer transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}