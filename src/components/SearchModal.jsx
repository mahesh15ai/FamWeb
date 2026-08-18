import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Users,
  FileText,
  Layers,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { performGlobalSearch } from "../api/searchService";

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    members: [],
    posts: [],
    albums: [],
    events: [],
    total_results: 0,
  });

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ members: [], posts: [], albums: [], events: [], total_results: 0 });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ members: [], posts: [], albums: [], events: [], total_results: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await performGlobalSearch(query);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) return null;

  const handleNavigate = (targetUrl) => {
    onClose();
    navigate(targetUrl);
  };

  const hasResults = results.total_results > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50/50">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members, posts, albums, events... (Ctrl + K)"
            className="w-full bg-transparent text-stone-900 placeholder:text-stone-400 font-medium text-sm sm:text-base focus:outline-hidden"
          />
          {loading && <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-bold text-stone-400 bg-stone-200/60 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Empty / Initial State */}
          {!query && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-bold text-stone-800">Quick Global Discovery</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Type at least 2 characters to search across members, posts, photos, and family events.
              </p>
            </div>
          )}

          {/* No results found */}
          {query.length >= 2 && !loading && !hasResults && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-stone-800">No results found for "{query}"</p>
              <p className="text-xs text-stone-400">
                Check spelling or search using another keyword.
              </p>
            </div>
          )}

          {/* 1. Family Members Section */}
          {results.members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-stone-400 px-1">
                <Users size={13} className="text-brand-600" />
                <span>Family Members ({results.members.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleNavigate(m.target_url)}
                    className="p-2.5 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-brand-50/50 hover:border-brand-200 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-xl object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                          {m.name?.[0]?.toUpperCase() || "M"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{m.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{m.email}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-stone-300 group-hover:text-brand-600 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Family Posts Section */}
          {results.posts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-stone-400 px-1">
                <FileText size={13} className="text-emerald-600" />
                <span>Posts & Feed ({results.posts.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.posts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleNavigate(p.target_url)}
                    className="p-3 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-emerald-50/40 hover:border-emerald-200 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900">{p.title}</p>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{p.content}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-stone-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Photo Albums Section */}
          {results.albums.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-stone-400 px-1">
                <Layers size={13} className="text-indigo-600" />
                <span>Albums ({results.albums.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.albums.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleNavigate(a.target_url)}
                    className="p-3 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{a.title}</p>
                      {a.description && <p className="text-[10px] text-stone-400 truncate mt-0.5">{a.description}</p>}
                    </div>
                    <ArrowUpRight size={14} className="text-stone-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Events Section */}
          {results.events.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-stone-400 px-1">
                <Calendar size={13} className="text-amber-600" />
                <span>Events ({results.events.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.events.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => handleNavigate(e.target_url)}
                    className="p-3 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-amber-50/40 hover:border-amber-200 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900">{e.title}</p>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        📅 {e.date} {e.location && `• 📍 ${e.location}`}
                      </p>
                    </div>
                    <ArrowUpRight size={14} className="text-stone-300 group-hover:text-amber-600 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded-md font-mono text-[10px] text-stone-600">ESC</kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Select to jump</span>
            <CornerDownLeft size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}