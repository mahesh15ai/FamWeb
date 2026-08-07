import apiClient from "./client";

/**
 * GET /api/comments/post/{post_id}/
 * Fetch all comments for a specific post
 */
export const getPostComments = async (postId) => {
  const response = await apiClient.get(`/comments/post/${postId}/`);
  return response.data;
};

/**
 * POST /api/comments/
 * Add a comment to a post
 */
export const createComment = async (postId, content) => {
  const response = await apiClient.post("/comments/", {
    post: postId,
    content: content.trim(),
  });
  return response.data;
};

/**
 * PATCH /api/comments/{id}/
 * Edit an existing comment
 */
export const updateComment = async (commentId, content) => {
  const response = await apiClient.patch(`/comments/${commentId}/`, {
    content: content.trim(),
  });
  return response.data;
};

/**
 * DELETE /api/comments/{id}/
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
  await apiClient.delete(`/comments/${commentId}/`);
};