import apiClient from "./client";

export const getChatRooms = async () => {
  const response = await apiClient.get("/chat/rooms/");
  return response.data;
};

export const startDirectChat = async (recipientId) => {
  const response = await apiClient.post("/chat/rooms/", { recipient_id: recipientId });
  return response.data;
};

export const getRoomMessages = async (roomId) => {
  const response = await apiClient.get(`/chat/rooms/${roomId}/messages/`);
  return response.data;
};

export const sendMessage = async (roomId, { content, image }) => {
  const formData = new FormData();
  if (content) formData.append("content", content);
  if (image) formData.append("image", image);

  const response = await apiClient.post(`/chat/rooms/${roomId}/messages/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getFamilyMembersForChat = async () => {
  const response = await apiClient.get("/chat/family-members/");
  return response.data;
};