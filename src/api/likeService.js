import apiClient from "./client";

// POST /api/posts/{id}/like/ -> Like a post[cite: 1]
export const likePost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/like/`);
  return response.data;
};

// DELETE /api/posts/{id}/like/ -> Unlike a post[cite: 1]
export const unlikePost = async (postId) => {
  const response = await apiClient.delete(`/posts/${postId}/like/`);
  return response.data;
};

// GET /api/posts/{id}/likes/ -> List users who liked a post[cite: 1]
export const getPostLikes = async (postId) => {
  const response = await apiClient.get(`/posts/${postId}/likes/`);
  return response.data;
};