import { apiClient } from "./client";

export async function createJoinRequest(familyCode) {
  const { data } = await apiClient.post("/join-requests/", { family_code: familyCode });
  return data;
}

export async function listJoinRequests() {
  const { data } = await apiClient.get("/join-requests/");
  return data;
}

export async function getJoinRequest(id) {
  const { data } = await apiClient.get(`/join-requests/${id}/`);
  return data;
}

export async function approveJoinRequest(id) {
  const { data } = await apiClient.patch(`/join-requests/${id}/approve/`);
  return data;
}

export async function rejectJoinRequest(id) {
  const { data } = await apiClient.patch(`/join-requests/${id}/reject/`);
  return data;
}

export async function withdrawJoinRequest(id) {
  const { data } = await apiClient.delete(`/join-requests/${id}/`);
  return data;
}