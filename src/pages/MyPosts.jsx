import { useEffect, useState } from "react";
import { MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import * as postsApi from "../api/posts";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";

export default function MyPosts() {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPosts();
  }, []);

  async function loadMyPosts() {
    try {
      setLoading(true);
      const res = await postsApi.getMyPosts();

      // 🎯 SAFELY EXTRACT ARRAY: Handles plain array, axios wrapper, or paginated object
      const rawData = res?.data || res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.results)
        ? rawData.results
        : [];

      setPosts(list);
    } catch (err) {
      toast.error("Failed to load your published posts.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePost(id, updatedContent) {
    try {
      const updated = await postsApi.updatePost(id, { content: updatedContent });
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      toast.success("Post updated!");
    } catch (err) {
      toast.error("Could not update post.");
    }
  }

  async function handleDeletePost(id) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await postsApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted.");
    } catch (err) {
      toast.error("Could not delete post.");
    }
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 antialiased selection:bg-brand-100 selection:text-brand-900 pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <div className="border-b border-stone-200/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
            My Published Posts
            <Sparkles className="w-5 h-5 text-brand-600" />
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Manage and edit posts published by your account.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-xs font-semibold">Loading your posts…</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900">No Posts Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              You haven't published any posts yet.
            </p>
          </div>
        ) : (
          /* Posts Feed */
          <div className="space-y-4">
            {posts
              .filter((post) => Boolean(post && post.id)) // 🛡️ Filter out null/undefined entries
              .map((post) => (
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