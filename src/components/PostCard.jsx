import { useState, useEffect } from "react";
import { Clock, Edit2, Trash2, MessageSquare, X, Maximize2 } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";
import CommentsSection from "./CommentsSection";
import { getPostComments } from "../api/commentService";

export default function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content || "");
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(
    post.comments_count ?? post.comments ?? 0
  );

  // Lightbox Media Modal State
  const [activeMedia, setActiveMedia] = useState(null); // { url, type: 'image' | 'video' }

  // Fetch comment count on mount
  useEffect(() => {
    let isMounted = true;

    async function loadCommentCount() {
      try {
        const data = await getPostComments(post.id);
        const list = data.results || [];
        if (isMounted) {
          setCommentCount(list.length);
        }
      } catch (err) {
        // Fallback to initial count
      }
    }

    if (post?.id) {
      loadCommentCount();
    }

    return () => {
      isMounted = false;
    };
  }, [post.id]);

  const isAuthor = currentUserId === post.author;
  const avatarUrl = resolveMediaUrl(post.author_profile_photo);
  const imageUrl = resolveMediaUrl(post.image);
  const videoUrl = resolveMediaUrl(post.video);

  async function handleSave() {
    try {
      setSubmitting(true);
      await onUpdate(post.id, content.trim());
      setIsEditing(false);
    } catch {
      // Handled by parent toast
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
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

        {/* Post Content & Media */}
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

            {/* CLICKABLE IMAGE ATTACHMENT */}
            {imageUrl && (
              <div
                onClick={() => setActiveMedia({ url: imageUrl, type: "image" })}
                className="relative group rounded-2xl overflow-hidden border border-stone-100 bg-stone-900 max-h-96 flex items-center justify-center cursor-pointer"
              >
                <img
                  src={imageUrl}
                  alt="Post attachment"
                  className="w-full h-full object-cover max-h-96 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 bg-black/60 rounded-full text-white">
                    <Maximize2 size={20} />
                  </div>
                </div>
              </div>
            )}

            {/* CLICKABLE VIDEO ATTACHMENT */}
            {videoUrl && (
              <div
                onClick={() => setActiveMedia({ url: videoUrl, type: "video" })}
                className="relative group rounded-2xl overflow-hidden border border-stone-100 bg-black max-h-96 flex items-center justify-center cursor-pointer"
              >
                <video src={videoUrl} className="w-full max-h-96 object-contain pointer-events-none" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="p-3 bg-black/60 rounded-full text-white">
                    <Maximize2 size={22} />
                  </div>
                </div>
              </div>
            )}

            {/* Comment Action Footer */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 text-stone-600 text-xs font-medium transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>
                  {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
                </span>
              </button>
            </div>

            {/* Expandable Comments Section */}
            {showComments && (
              <CommentsSection
                postId={post.id}
                currentUserId={currentUserId}
                onCommentCountChange={(newCount) => setCommentCount(newCount)}
              />
            )}
          </>
        )}
      </div>

      {/* FULL-SCREEN MEDIA LIGHTBOX MODAL */}
      {activeMedia && (
        <div
          onClick={() => setActiveMedia(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveMedia(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-10"
          >
            <X size={24} />
          </button>

          {/* Media Display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex items-center justify-center overflow-hidden rounded-2xl"
          >
            {activeMedia.type === "image" && (
              <img
                src={activeMedia.url}
                alt="Enlarged media"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            {activeMedia.type === "video" && (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}