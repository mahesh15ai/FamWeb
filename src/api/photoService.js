// src/api/photoService.js
import apiClient from "./client";

export const getPhotosByAlbum = async (albumId) => {
  const response = await apiClient.get(`/photos/?album=${albumId}`);
  return response.data;
};

export const uploadPhotos = async (albumId, files, caption = "") => {
  const formData = new FormData();
  formData.append("album", albumId);
  formData.append("caption", caption);

  Array.from(files).forEach((file) => {
    formData.append("images", file);
  });

  const response = await apiClient.post("/photos/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deletePhoto = async (photoId) => {
  const response = await apiClient.delete(`/photos/${photoId}/`);
  return response.data;
};

export const deleteMultiplePhotos = async (photoIds) => {
  const deletePromises = photoIds.map((id) => apiClient.delete(`/photos/${id}/`));
  return await Promise.all(deletePromises);
};

// Download single image via blob link
export const downloadSinglePhoto = async (imageUrl, filename = "photo.jpg") => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback direct window download
    window.open(imageUrl, "_blank");
  }
};