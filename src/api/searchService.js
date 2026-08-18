import apiClient from "./client";

export const performGlobalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return {
      members: [],
      posts: [],
      albums: [],
      events: [],
      total_results: 0,
    };
  }
  const response = await apiClient.get(`/dashboard/search/?q=${encodeURIComponent(query.trim())}`);
  return response.data;
};