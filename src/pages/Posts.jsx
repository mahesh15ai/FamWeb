import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  AtSign,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as postsApi from "../api/posts";
import * as membershipApi from "../api/membership";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";

function getMemberDisplayName(member) {
  if (!member) return "Member";

  if (member.user_full_name) return member.user_full_name;
  if (member.user_name) return member.user_name;
  if (member.user_first_name) return member.user_first_name;
  if (member.user_email) return member.user_email.split("@")[0];

  if (member.full_name) return member.full_name;
  if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`;
  if (member.first_name) return member.first_name;
  if (member.username) return member.username;
  if (member.name) return member.name;

  if (member.user) {
    if (typeof member.user === "string") return member.user;
    if (member.user.full_name) return member.user.full_name;
    if (member.user.first_name && member.user.last_name)
      return `${member.user.first_name} ${member.user.last_name}`;
    if (member.user.first_name) return member.user.first_name;
    if (member.user.username) return member.user.username;
    if (member.user.email) return member.user.email.split("@")[0];
  }

  if (member.email) return member.email.split("@")[0];

  return "Member";
}

export default function Posts() {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Mention Dropdown States
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [taggedUserIds, setTaggedUserIds] = useState([]);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    try {
      setLoading(true);
      const [postsData, membersData] = await Promise.allSettled([
        postsApi.getPosts(),
        membershipApi.listMembers(),
      ]);

      if (postsData.status === "fulfilled") {
        setPosts(Array.isArray(postsData.value) ? postsData.value : postsData.value?.results ?? []);
      }
      if (membersData.status === "fulfilled") {
        const list = Array.isArray(membersData.value) ? membersData.value : membersData.value?.results ?? [];
        setMembers(list);
      }
    } catch {
      toast.error("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }

  function handleContentChange(e) {
    const value = e.target.value;
    setContent(value);

    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setMentionMenuOpen(true);
    } else {
      setMentionMenuOpen(false);
    }
  }

  function handleSelectMention(member) {
    const words = content.split(/\s+/);
    words.pop();

    const nameToDisplay = getMemberDisplayName(member);
    const updatedContent = [...words, `@${nameToDisplay}`].join(" ") + " ";

    setContent(updatedContent);

    const userId =
      member.user_id ||
      (typeof member.user === "object" ? member.user?.id : member.user) ||
      member.id;

    if (userId) {
      setTaggedUserIds((prev) => [...prev, userId]);
    }
    setMentionMenuOpen(false);
  }

  function handleFileSelect(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileType(type);
    setMediaPreview(URL.createObjectURL(file));
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    setFileType(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!content.trim() && !selectedFile) {
      toast.error("Please add text, a photo, or a video.");
      return;
    }

    const formData = new FormData();
    if (content.trim()) formData.append("content", content.trim());
    if (selectedFile && fileType === "image") formData.append("image", selectedFile);
    if (selectedFile && fileType === "video") formData.append("video", selectedFile);

    // Only send user IDs that are actually typed in the message field
    const activeTaggedIds = taggedUserIds.filter((id) => {
      const memberObj = members.find((m) => {
        const mId = m.user_id || (typeof m.user === "object" ? m.user?.id : m.user) || m.id;
        return mId === id;
      });
      if (!memberObj) return false;
      const name = getMemberDisplayName(memberObj);
      return content.includes(`@${name}`);
    });

    [...new Set(activeTaggedIds)].forEach((id) => {
      formData.append("mentioned_user_ids", id);
    });

    try {
      setSubmitting(true);
      const newPost = await postsApi.createPost(formData);
      setPosts((prev) => [newPost, ...prev]);

      setContent("");
      setTaggedUserIds([]);
      removeSelectedFile();
      toast.success("Post published!");
    } catch {
      toast.error("Could not publish post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdatePost(id, updatedContent) {
    try {
      const updated = await postsApi.updatePost(id, { content: updatedContent });
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success("Post updated!");
    } catch {
      toast.error("Could not update post.");
    }
  }

  async function handleDeletePost(id) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await postsApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted.");
    } catch {
      toast.error("Could not delete post.");
    }
  }

  const filteredMembers = members.filter((m) => {
    const name = getMemberDisplayName(m).toLowerCase();
    return name.includes(mentionFilter);
  });

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="border-b border-stone-200/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
            Family Workspace Feed
            <Sparkles className="w-5 h-5 text-brand-600" />
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Type <span className="font-mono bg-stone-200 px-1 rounded text-stone-800">@</span> to mention family members by name.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleCreatePost}
          className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm space-y-4 relative"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.first_name?.[0] || <User className="w-5 h-5" />}
            </div>

            <div className="flex-1 relative">
              <textarea
                rows={3}
                value={content}
                onChange={handleContentChange}
                placeholder="Share updates... (Type @ to mention family members)"
                className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-none"
              />

              {/* Mentions Auto-complete Dropdown */}
              {mentionMenuOpen && filteredMembers.length > 0 && (
                <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-stone-400 uppercase tracking-widest border-b border-stone-100">
                    Mention Member
                  </div>
                  {filteredMembers.map((m, idx) => {
                    const displayName = getMemberDisplayName(m);

                    return (
                      <button
                        key={m.id || idx}
                        type="button"
                        onClick={() => handleSelectMention(m)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <AtSign className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="font-bold text-stone-800">{displayName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Media Attachment Preview */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 max-h-64 bg-stone-900 flex items-center justify-center">
              <button
                type="button"
                onClick={removeSelectedFile}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {fileType === "image" && (
                <img src={mediaPreview} alt="Attachment" className="w-full h-full object-cover max-h-64" />
              )}
              {fileType === "video" && (
                <video src={mediaPreview} controls className="w-full max-h-64 object-contain" />
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "image")}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Photo</span>
              </button>

              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={(e) => handleFileSelect(e, "video")}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <VideoIcon className="w-4 h-4 text-indigo-600" />
                <span>Video</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || (!content.trim() && !selectedFile)}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-150 active:scale-95 text-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Publishing..." : "Post Message"}</span>
            </button>
          </div>
        </form>

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-40 rounded-3xl border border-stone-200" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900">No Posts Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Be the first to publish an update or mention family members.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}