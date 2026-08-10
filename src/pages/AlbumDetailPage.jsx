import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
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
  Play,
  Film,
} from "lucide-react";

import { getAlbumById } from "../api/albumService";
import {
  getPhotosByAlbum,
  uploadPhotos,
  deletePhoto,
  deleteMultiplePhotos,
  downloadSinglePhoto,
} from "../api/photoService";
import {
  getVideosByAlbum,
  uploadVideos,
  deleteVideo,
  downloadSingleVideo,
} from "../api/videoService";

import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
export default function AlbumDetailPage() {
  const { id: albumId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Active Gallery Tab
  const [activeTab, setActiveTab] = useState("photos"); // 'photos' | 'videos'

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-Selection State (Photos)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  // Photo Upload States
  const [uploadingPhotosState, setUploadingPhotosState] = useState(false);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Video Upload States
  const [uploadingVideosState, setUploadingVideosState] = useState(false);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Viewers
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  // Fetch Album Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [albumData, photosData, videosData] = await Promise.all([
        getAlbumById(albumId),
        getPhotosByAlbum(albumId),
        getVideosByAlbum(albumId),
      ]);
      setAlbum(albumData);
      setPhotos(photosData.results || []);
      setVideos(videosData.results || []);
    } catch (err) {
      toast.error("Failed to load album details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchData();
  }, [albumId]);

  // Handle Photo File Select
  const handlePhotoFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPhotoFiles(Array.from(e.target.files));
      setShowPhotoModal(true);
    }
  };

  // Submit Photo Upload
  const handlePhotoUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPhotoFiles.length) return;

    try {
      setUploadingPhotosState(true);
      await uploadPhotos(albumId, selectedPhotoFiles, photoCaption);
      toast.success(`${selectedPhotoFiles.length} photo(s) uploaded!`);
      setSelectedPhotoFiles([]);
      setPhotoCaption("");
      setShowPhotoModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to upload photos.");
    } finally {
      setUploadingPhotosState(false);
    }
  };

  // Handle Video File Select
  const handleVideoFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedVideoFiles(Array.from(e.target.files));
      setShowVideoModal(true);
    }
  };

  // Submit Video Upload
  const handleVideoUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVideoFiles.length) return;

    try {
      setUploadingVideosState(true);
      await uploadVideos(albumId, selectedVideoFiles, videoTitle, videoCaption);
      toast.success(`${selectedVideoFiles.length} video(s) uploaded!`);
      setSelectedVideoFiles([]);
      setVideoTitle("");
      setVideoCaption("");
      setShowVideoModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to upload video(s).");
    } finally {
      setUploadingVideosState(false);
    }
  };

  // Photo Single Actions
  const handleDownloadPhoto = (photo, e) => {
    if (e) e.stopPropagation();
    downloadSinglePhoto(photo.image_url || photo.image, `photo_${photo.id}.jpg`);
  };

  const handleDeletePhoto = async (photoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this photo?")) return;

    try {
      await deletePhoto(photoId);
      toast.success("Photo deleted.");
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (activePhoto?.id === photoId) setActivePhoto(null);
    } catch (err) {
      toast.error("Failed to delete photo.");
    }
  };

  // Video Actions
  const handleDownloadVideo = (video, e) => {
    if (e) e.stopPropagation();
    downloadSingleVideo(video.video_url || video.video_file, `video_${video.id}.mp4`);
  };

  const handleDeleteVideo = async (videoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this video?")) return;

    try {
      await deleteVideo(videoId);
      toast.success("Video deleted.");
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      if (activeVideo?.id === videoId) setActiveVideo(null);
    } catch (err) {
      toast.error("Failed to delete video.");
    }
  };

  // Multi-Select Helpers
  const toggleSelectPhoto = (photoId, e) => {
    if (e) e.stopPropagation();
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map((p) => p.id));
    }
  };

  const handleBulkDownload = async () => {
    if (!selectedPhotoIds.length) return;
    try {
      setDownloadingBulk(true);
      const selected = photos.filter((p) => selectedPhotoIds.includes(p.id));
      for (const p of selected) {
        await downloadSinglePhoto(p.image_url || p.image, `photo_${p.id}.jpg`);
      }
      toast.success("Downloaded selected photos!");
    } finally {
      setDownloadingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedPhotoIds.length) return;
    if (!window.confirm(`Delete ${selectedPhotoIds.length} photo(s)?`)) return;

    try {
      setDeletingBulk(true);
      await deleteMultiplePhotos(selectedPhotoIds);
      toast.success("Selected photos deleted.");
      setPhotos((prev) => prev.filter((p) => !selectedPhotoIds.includes(p.id)));
      setIsSelectMode(false);
      setSelectedPhotoIds([]);
    } finally {
      setDeletingBulk(false);
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
            {/* File Inputs */}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoFileChange}
              multiple
              accept="video/*"
              className="hidden"
            />

            {/* Action Buttons */}
            <button
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <UploadCloud size={16} />
              Upload Photos
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Film size={16} />
              Upload Videos
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("photos");
                setIsSelectMode(false);
              }}
              className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === "photos"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                  : "text-stone-500 hover:bg-stone-200/60"
              }`}
            >
              <ImageIcon size={16} className="text-emerald-600" />
              Photos ({photos.length})
            </button>

            <button
              onClick={() => {
                setActiveTab("videos");
                setIsSelectMode(false);
              }}
              className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer ${
                activeTab === "videos"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                  : "text-stone-500 hover:bg-stone-200/60"
              }`}
            >
              <VideoIcon size={16} className="text-indigo-600" />
              Videos ({videos.length})
            </button>
          </div>

          {/* Photos Multi-Select Controls */}
          {activeTab === "photos" && photos.length > 0 && (
            <div>
              {isSelectMode ? (
                <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-stone-700 shadow-xs cursor-pointer"
                  >
                    {selectedPhotoIds.length === photos.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={handleBulkDownload}
                    disabled={downloadingBulk || !selectedPhotoIds.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <Download size={14} /> ({selectedPhotoIds.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deletingBulk || !selectedPhotoIds.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={14} /> ({selectedPhotoIds.length})
                  </button>
                  <button
                    onClick={() => setIsSelectMode(false)}
                    className="p-1.5 text-stone-500 hover:text-stone-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-2xl shadow-xs hover:bg-stone-50 cursor-pointer"
                >
                  <CheckSquare size={15} /> Select
                </button>
              )}
            </div>
          )}
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-stone-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === "photos" ? (
          /* PHOTOS GRID */
          photos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-800">No Photos Yet</h3>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-1 cursor-pointer"
              >
                + Upload First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={(e) =>
                      isSelectMode ? toggleSelectPhoto(photo.id, e) : setActivePhoto(photo)
                    }
                    className={`group relative aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all border ${
                      isSelected
                        ? "ring-4 ring-brand-500 border-transparent scale-[0.98]"
                        : "border-stone-200/60"
                    }`}
                  >
                    <img
                      src={photo.image_url || photo.image}
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isSelectMode && (
                      <div className="absolute top-3 left-3 z-10">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 text-brand-600 fill-white" />
                        ) : (
                          <Square className="w-6 h-6 text-white/80 fill-black/30" />
                        )}
                      </div>
                    )}

                    {!isSelectMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={(e) => handleDownloadPhoto(photo, e)}
                            className="p-1.5 bg-black/50 hover:bg-brand-600 text-white rounded-xl transition-colors cursor-pointer"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeletePhoto(photo.id, e)}
                            className="p-1.5 bg-black/50 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-stone-300">
                          <Maximize2 size={10} /> Expand
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* VIDEOS GRID */
          videos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <VideoIcon size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-800">No Videos Yet</h3>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-1 cursor-pointer"
              >
                + Upload First Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Video Thumbnail Preview */}
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={vid.video_url || vid.video_file}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-2 ring-white/50 group-hover:scale-110 transition-transform">
                      <Play size={20} className="fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {vid.title || "Family Video"}
                    </h3>
                    {vid.caption && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {vid.caption}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {vid.uploaded_by_name || "Member"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDownloadVideo(vid, e)}
                          className="p-1 hover:text-brand-600 transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          className="p-1 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Upload {selectedPhotoFiles.length} Photo(s)
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePhotoUploadSubmit} className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-stone-700">Selected Files:</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {selectedPhotoFiles.map((f, i) => (
                    <p key={i} className="text-[11px] text-stone-500 truncate">
                      📷 {f.name}
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
                  placeholder="Add a photo description..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhotosState}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {uploadingPhotosState ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading...
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

      {/* Video Upload Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Upload {selectedVideoFiles.length} Video(s)
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVideoUploadSubmit} className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-stone-700">Selected Videos:</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {selectedVideoFiles.map((f, i) => (
                    <p key={i} className="text-[11px] text-stone-500 truncate">
                      🎬 {f.name} ({Math.round(f.size / (1024 * 1024))} MB)
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rudra Cake Cutting Video 🎥"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Caption / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add details about this clip..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingVideosState}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {uploadingVideosState ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10 cursor-default"
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              <X size={20} />
            </button>

            <div className="p-2 flex items-center justify-center bg-black/40">
              <img
                src={activePhoto.image_url || activePhoto.image}
                alt="Enlarged view"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </div>

            <div className="p-4 bg-stone-900 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
              <div>
                {activePhoto.caption && (
                  <p className="font-bold text-white text-sm">{activePhoto.caption}</p>
                )}
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Uploaded by {activePhoto.uploaded_by_name || "Member"} on{" "}
                  {new Date(activePhoto.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => handleDownloadPhoto(activePhoto, e)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold flex items-center gap-1"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={(e) => handleDeletePhoto(activePhoto.id, e)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold flex items-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Streaming Player Modal */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10 cursor-default"
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              <X size={20} />
            </button>

            {/* Video Player */}
            <div className="p-2 bg-black flex items-center justify-center">
              <video
                src={activeVideo.video_url || activeVideo.video_file}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-2xl"
              />
            </div>

            <div className="p-4 bg-stone-900 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
              <div>
                <h3 className="font-bold text-white text-base">
                  {activeVideo.title || "Family Video"}
                </h3>
                {activeVideo.caption && (
                  <p className="text-stone-400 mt-0.5">{activeVideo.caption}</p>
                )}
                <p className="text-[11px] text-stone-500 mt-1">
                  Uploaded by {activeVideo.uploaded_by_name || "Member"} on{" "}
                  {new Date(activeVideo.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => handleDownloadVideo(activeVideo, e)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold flex items-center gap-1"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={(e) => handleDeleteVideo(activeVideo.id, e)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold flex items-center gap-1"
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