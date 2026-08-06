import { apiClient } from "./client";

export async function getPosts() {
  const response = await apiClient.get("posts/");
  return response.data;
}

export async function createPost(formData) {
  const response = await apiClient.post("posts/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function getMyPosts() {
  const response = await apiClient.get("posts/my-posts/");
  return response.data;
}

export async function getPostDetail(id) {
  const response = await apiClient.get(`posts/${id}/`);
  return response.data;
}

export async function updatePost(id, data) {
  const response = await apiClient.patch(`posts/${id}/`, data);
  return response.data;
}

export async function deletePost(id) {
  const response = await apiClient.delete(`posts/${id}/`);
  return response.data;
}