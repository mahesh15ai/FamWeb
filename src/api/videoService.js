import apiClient from "./client";

export const getVideosByAlbum = async (albumId) => {
  const response = await apiClient.get(`/videos/?album=${albumId}`);
  return response.data;
};

export const uploadVideos = async (albumId, files, title = "", caption = "") => {
  const formData = new FormData();
  formData.append("album", albumId);
  formData.append("title", title);
  formData.append("caption", caption);

  Array.from(files).forEach((file) => {
    formData.append("videos", file);
  });

  const response = await apiClient.post("/videos/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteVideo = async (videoId) => {
  const response = await apiClient.delete(`/videos/${videoId}/`);
  return response.data;
};

export const downloadSingleVideo = async (videoUrl, filename = "video.mp4") => {
  try {
    const response = await fetch(videoUrl);
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
    window.open(videoUrl, "_blank");
  }
};