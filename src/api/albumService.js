import apiClient from "./client";

// List all family albums (GET /api/albums/)
export const getAlbums = async () => {
  const response = await apiClient.get("/albums/");
  return response.data;
};

// Create a new album (POST /api/albums/)
export const createAlbum = async (albumData) => {
  const response = await apiClient.post("/albums/", albumData);
  return response.data;
};

// Get single album details (GET /api/albums/{id}/)
export const getAlbumById = async (albumId) => {
  const response = await apiClient.get(`/albums/${albumId}/`);
  return response.data;
};

// Update album title/description (PATCH /api/albums/{id}/)
export const updateAlbum = async (albumId, updateData) => {
  const response = await apiClient.patch(`/albums/${albumId}/`, updateData);
  return response.data;
};

// Delete an album (DELETE /api/albums/{id}/)
export const deleteAlbum = async (albumId) => {
  const response = await apiClient.delete(`/albums/${albumId}/`);
  return response.data;
};