import { useState } from "react";
import { Clock, Edit2, Trash2, AtSign } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";

export default function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content || "");
  const [submitting, setSubmitting] = useState(false);

  const isAuthor = currentUserId === post.author;
  const avatarUrl = resolveMediaUrl(post.author_profile_photo);
  const imageUrl = resolveMediaUrl(post.image);
  const videoUrl = resolveMediaUrl(post.video);

  async function handleSave() {
    try {
      setSubmitting(true);
      await onUpdate(post.id, content.trim());
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={post.author_name}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-stone-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 font-extrabold text-sm flex items-center justify-center">
              {post.author_name?.[0]?.toUpperCase() || "M"}
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-stone-900">
              {post.author_name || "Family Member"}
            </h4>
            <p className="text-[11px] text-stone-400 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {isAuthor && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content / Edit Mode */}
      {isEditing ? (
        <div className="space-y-3 pt-2">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setContent(post.content || "");
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.content && (
            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          )}

          {/* Tagged Mentions */}
          

          {/* Image Attachment */}
          {imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-stone-100 bg-stone-900 max-h-96 flex items-center justify-center">
              <img src={imageUrl} alt="Post attachment" className="w-full h-full object-cover max-h-96" />
            </div>
          )}

          {/* Video Attachment */}
          {videoUrl && (
            <div className="rounded-2xl overflow-hidden border border-stone-100 bg-black">
              <video src={videoUrl} controls className="w-full max-h-96 object-contain" />
            </div>
          )}
        </>
      )}
    </div>
  );
}