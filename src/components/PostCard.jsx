import { useState, useEffect } from "react";
import {
  Clock,
  Edit2,
  Trash2,
  MessageSquare,
  X,
  Maximize2,
  Heart,
  Users,
} from "lucide-react";
import { resolveMediaUrl } from "../utils/media";
import CommentsSection from "../components/CommentsSection";
import { getPostComments } from "../api/commentService";
import { likePost, unlikePost, getPostLikes } from "../api/likeService";
import { useToast } from "../context/ToastContext";

export default function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  if (!post) return null;

  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content || "");
  const [submitting, setSubmitting] = useState(false);

  // Day 11 Likes State
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked));
  const [likeCount, setLikeCount] = useState(post.likes_count ?? post.likes ?? 0);
  const [likers, setLikers] = useState([]);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [loadingLikers, setLoadingLikers] = useState(false);

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(
    post.comments_count ?? post.comments ?? 0
  );

  // Lightbox Media Modal State
  const [activeMedia, setActiveMedia] = useState(null);

  // Auto-refresh likes & comments data on render
  useEffect(() => {
    let isMounted = true;

    async function refreshPostData() {
      try {
        const commentsData = await getPostComments(post.id);
        const commentList = commentsData.results || [];
        if (isMounted) setCommentCount(commentList.length);

        const likesData = await getPostLikes(post.id);
        const likesList = likesData.results || [];
        if (isMounted) {
          setLikeCount(likesData.count ?? likesList.length);

          // Check if current user is in the returned likes list
          const userHasLiked = likesList.some(
            (item) => item.user_id === currentUserId || item.user === currentUserId
          );
          setIsLiked(userHasLiked);
        }
      } catch (err) {
        // Fallback silently
      }
    }

    if (post?.id) refreshPostData();

    return () => {
      isMounted = false;
    };
  }, [post.id, currentUserId]);

  // Handle Like / Unlike Action
  const handleToggleLike = async () => {
    const previousLikedState = isLiked;
    const previousCount = likeCount;

    setIsLiked(!previousLikedState);
    setLikeCount((prev) => (previousLikedState ? prev - 1 : prev + 1));

    try {
      if (previousLikedState) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (err) {
      setIsLiked(previousLikedState);
      setLikeCount(previousCount);
      toast.error("Failed to update like status.");
    }
  };

  // Fetch & Show users who liked the post
  const handleOpenLikersModal = async () => {
    setShowLikersModal(true);
    setLoadingLikers(true);
    try {
      const data = await getPostLikes(post.id);
      setLikers(data.results || []);
    } catch (err) {
      toast.error("Failed to load likes list.");
    } finally {
      setLoadingLikers(false);
    }
  };

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
    <>
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
        {/* Author Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={post.author_name || "Author"}
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
                {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
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

            {/* Image Attachment */}
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

            {/* Video Attachment */}
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

            {/* Post Action Buttons */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-125 cursor-pointer text-xs font-medium ${
                    isLiked
                      ? "bg-rose-50 text-rose-600 font-bold"
                      : "hover:bg-stone-100 text-stone-600"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? "fill-rose-500 text-rose-500" : "text-stone-400"
                    }`}
                  />
                  <span>{isLiked ? "Liked" : "Like"}</span>
                </button>

                {likeCount > 0 && (
                  <button
                    onClick={handleOpenLikersModal}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 hover:underline cursor-pointer px-1"
                  >
                    {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                  </button>
                )}
              </div>

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

      {/* Likers Modal Popup */}
      {showLikersModal && (
        <div
          onClick={() => setShowLikersModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-100"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                Liked by
              </h3>
              <button
                onClick={() => setShowLikersModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {loadingLikers ? (
              <div className="py-6 text-center text-xs text-stone-400">Loading likers…</div>
            ) : likers.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">No likes yet.</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1">
                {likers.map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-stone-50">
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {(item.user || item.username || "U")[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-stone-800">
                      {item.user || item.username || "Family Member"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Lightbox Modal */}
      {activeMedia && (
        <div
          onClick={() => setActiveMedia(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <button
            onClick={() => setActiveMedia(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer z-10"
          >
            <X size={24} />
          </button>

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