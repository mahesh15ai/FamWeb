import { useState } from "react";
import { Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";

export default function CommentItem({ comment, currentUserId, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if logged in user is the owner of the comment
  const isOwner = currentUserId === comment.author_id;

  const avatarUrl = resolveMediaUrl(comment.author_profile_photo);
  const authorInitial = comment.author?.[0]?.toUpperCase() || "U";

  const handleSave = async () => {
    const trimmed = editedContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(comment.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-stone-50/80 transition-colors group">
      {/* 👤 PROFILE PICTURE / AVATAR */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={comment.author}
          className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-200 mt-0.5 flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
          {authorInitial}
        </div>
      )}

      {/* COMMENT CONTENT & EDIT MODE */}
      <div className="flex-1 min-w-0">
        <div className="bg-stone-100/70 rounded-2xl px-3 py-2 text-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-stone-900 truncate">
              {comment.author}
            </span>
            <span className="text-[10px] text-stone-400 font-medium flex-shrink-0">
              {comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
            </span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
                disabled={isSaving}
              />
              <button
                onClick={handleSave}
                disabled={isSaving || !editedContent.trim()}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
                className="p-1 text-stone-400 hover:bg-stone-200 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <p className="text-stone-700 leading-snug whitespace-pre-line break-words">
              {comment.content}
            </p>
          )}
        </div>
      </div>

      {/* ✏️ / 🗑️ CRUD ACTIONS (VISIBLE TO COMMENT OWNER) */}
      {isOwner && !isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-center">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            title="Edit comment"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-50"
            title="Delete comment"
          >
            {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        </div>
      )}
    </div>
  );
}