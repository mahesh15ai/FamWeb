import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, Smile, X } from "lucide-react";
import CommentItem from "./CommentItem";
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
} from "../api/commentService";
import { useToast } from "../context/ToastContext";

const MAX_COMMENT_LENGTH = 150;

// 5 Emoji Categories Setup
const EMOJI_CATEGORIES = [
  { name: "Smileys", emojis: ["😊", "😄", "😍", "🥰", "😂", "🤩", "😎"] },
  { name: "Hearts", emojis: ["❤️", "💖", "💕", "💙", "💜", "💗", "🤍"] },
  { name: "Gestures", emojis: ["👍", "🙌", "👏", "🙏", "🤝", "✌️", "🫡"] },
  { name: "Party", emojis: ["🎉", "🎊", "🥳", "✨", "🔥", "⭐", "🎁"] },
  { name: "Family", emojis: ["🏡", "👨‍👩‍👧‍👦", "🌸", "☀️", "🍰", "☕", "📸"] },
];

export default function CommentsSection({ postId, currentUserId, onCommentCountChange }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emoji Drawer States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const onCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const data = await getPostComments(postId);
      const list = data.results || [];

      setComments(list);

      if (onCountChangeRef.current) {
        onCountChangeRef.current(list.length);
      }
    } catch (err) {
      toast.error("Failed to load comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const appendEmoji = (emoji) => {
    if (newComment.length + emoji.length <= MAX_COMMENT_LENGTH) {
      setNewComment((prev) => prev + emoji);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const trimmed = newComment.trim();

    if (!trimmed) {
      toast.error("Please enter a comment.");
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createComment(postId, trimmed);

      const normalizedComment = {
        id: created.id,
        post: created.post || postId,
        author: created.author || "You",
        author_id: created.author_id,
        author_profile_photo: created.author_profile_photo,
        content: created.content,
        created_at: created.created_at || new Date().toISOString(),
      };

      const updatedList = [...comments, normalizedComment];
      setComments(updatedList);
      setNewComment("");
      setShowEmojiPicker(false);

      if (onCountChangeRef.current) {
        onCountChangeRef.current(updatedList.length);
      }

      toast.success("Comment added!");
    } catch (err) {
      const backendError =
        err.response?.data?.content?.[0] ||
        err.response?.data?.detail ||
        "Failed to post comment.";
      toast.error(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    const trimmed = content.trim();

    if (!trimmed) {
      toast.error("Comment content cannot be blank.");
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      const updated = await updateComment(commentId, trimmed);
      setComments((prev) =>
        prev.map((item) => (item.id === commentId ? { ...item, content: updated.content } : item))
      );
      toast.success("Comment updated!");
    } catch (err) {
      const backendError =
        err.response?.data?.content?.[0] ||
        err.response?.data?.detail ||
        "Failed to update comment.";
      toast.error(backendError);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      const updatedList = comments.filter((item) => item.id !== commentId);
      setComments(updatedList);

      if (onCountChangeRef.current) {
        onCountChangeRef.current(updatedList.length);
      }
      toast.success("Comment deleted!");
    } catch (err) {
      toast.error("Failed to delete comment.");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-3">
      {/* Comments List (Scrollable, but scrollbar is completely hidden) */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-stone-400">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-xs">Loading comments…</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-3 text-xs text-stone-400 flex items-center justify-center gap-1">
          <MessageSquare size={14} />
          No comments yet. Be the first to reply!
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* 5 Quick Reaction Emojis */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-stone-400 font-medium mr-1">Quick:</span>
        {["❤️", "👍", "😊", "🎉", "🔥"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => appendEmoji(emoji)}
            className="text-xs hover:bg-stone-100 p-1 rounded-lg transition-transform active:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form with Emoji Drawer */}
      <form onSubmit={handleAddComment} className="flex flex-col gap-1 relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-xl border border-stone-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 px-3 py-1 text-xs">
            <input
              type="text"
              value={newComment}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              disabled={isSubmitting}
              className="w-full bg-transparent py-1 text-xs focus:outline-none disabled:bg-stone-100"
            />
            {/* Emoji Picker Toggle Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-1 text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Add Emoji"
            >
              <Smile size={16} />
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="rounded-xl bg-brand-500 text-white p-2.5 hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            aria-label="Send comment"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* Character Count */}
        {newComment.length > 0 && (
          <span
            className={`text-[10px] text-right pr-1 ${
              newComment.length > 130 ? "text-amber-600 font-bold" : "text-stone-400"
            }`}
          >
            {newComment.length}/{MAX_COMMENT_LENGTH}
          </span>
        )}

        {/* Expandable 5-Category Emoji Drawer Popup */}
        {showEmojiPicker && (
          <div className="absolute right-12 bottom-full mb-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
              {/* 5 Category Navigation Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                      activeCategory === idx
                        ? "bg-brand-500 text-white"
                        : "text-stone-500 hover:bg-stone-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X size={12} />
              </button>
            </div>

            {/* Category Emojis Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => appendEmoji(emoji)}
                  className="text-sm p-1 rounded-lg hover:bg-stone-100 transition-transform active:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}