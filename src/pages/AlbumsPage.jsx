import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Edit3,
  X,
  Calendar as CalendarIcon,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from "../api/albumService";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";

export default function AlbumsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load Albums
  const fetchAlbumsList = async () => {
    try {
      setLoading(true);
      const data = await getAlbums();
      setAlbums(data.results || []);
    } catch (err) {
      toast.error("Failed to load family albums.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbumsList();
  }, []);

  // Filter & Sort Albums logic
  const filteredAlbums = useMemo(() => {
    let result = [...albums];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (album) =>
          album.title.toLowerCase().includes(query) ||
          (album.description && album.description.toLowerCase().includes(query))
      );
    }

    // 2. Specific Date Filter
    if (filterDate) {
      result = result.filter((album) => {
        if (!album.created_at) return false;
        const albumDate = new Date(album.created_at).toISOString().split("T")[0];
        return albumDate === filterDate;
      });
    }

    // 3. Sorting (Newest vs Oldest)
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [albums, searchQuery, filterDate, sortOrder]);

  // Open Create / Edit Modal
  const handleOpenModal = (album = null, e = null) => {
    if (e) e.stopPropagation();
    if (album) {
      setEditingAlbum(album);
      setTitle(album.title);
      setDescription(album.description || "");
    } else {
      setEditingAlbum(null);
      setTitle("");
      setDescription("");
    }
    setShowModal(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Album title is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingAlbum) {
        await updateAlbum(editingAlbum.id, {
          title: title.trim(),
          description: description.trim(),
        });
        toast.success("Album updated successfully!");
      } else {
        await createAlbum({
          title: title.trim(),
          description: description.trim(),
        });
        toast.success("New album created successfully!");
      }
      setShowModal(false);
      fetchAlbumsList();
    } catch (err) {
      toast.error("Failed to save album.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (albumId, e = null) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this album?")) return;

    try {
      await deleteAlbum(albumId);
      toast.success("Album deleted.");
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    } catch (err) {
      toast.error("Failed to delete album.");
    }
  };

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterDate("");
    setSortOrder("newest");
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
              <Layers className="w-7 h-7 text-brand-600" />
              Family Albums
            </h1>
            <p className="text-xs font-semibold text-stone-500 mt-1">
              Organize event memories, trips, and family celebrations into photo albums.
            </p>
          </div>

          <button
            onClick={(e) => handleOpenModal(null, e)}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap self-start lg:self-auto"
          >
            <Plus size={16} />
            Create New Album
          </button>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/80 rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Date Picker Filter */}
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="ml-1 text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <ArrowUpDown size={14} />
              Sort:
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {(searchQuery || filterDate || sortOrder !== "newest") && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 underline px-2 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Album List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-stone-200 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <FolderPlus size={24} />
            </div>
            <h3 className="text-base font-bold text-stone-800">
              No Albums Created Yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Start organizing your family memories by creating an album for trips, birthdays, or events!
            </p>
            <button
              onClick={(e) => handleOpenModal(null, e)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-2 cursor-pointer"
            >
              + Create First Album
            </button>
          </div>
        ) : filteredAlbums.length === 0 ? (
          /* Filter/Search Empty State */
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <Filter size={22} />
            </div>
            <h3 className="text-base font-bold text-stone-800">
              No Albums Match Your Filter
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No albums match the selected criteria. Try adjusting or resetting your search and date filters.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-1 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/albums/${album.id}`)}
                className="group bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Folder Header Icon & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <FolderPlus size={24} />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenModal(album, e)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(album.id, e)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Album Info */}
                  <div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Album Counts & Metadata */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <ImageIcon size={14} />
                      {album.photo_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Video size={14} />
                      {album.video_count || 0}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400 flex items-center gap-1">
                    <CalendarIcon size={12} />
                    {album.created_at
                      ? new Date(album.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Album Modal */}
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-100"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold text-stone-900">
                  {editingAlbum ? "Edit Album" : "Create New Album"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Trip, Wedding"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add details about this memory or event..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {submitting
                      ? "Saving..."
                      : editingAlbum
                      ? "Update Album"
                      : "Create Album"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}