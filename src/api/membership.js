import { apiClient } from "./client";

export async function listMembers() {
  const { data } = await apiClient.get("/members/");
  return data;
}

export async function getMember(id) {
  const { data } = await apiClient.get(`/members/${id}/`);
  return data;
}

export async function updateMemberRole(id, role) {
  const { data } = await apiClient.patch(`/members/${id}/role/`, { role });
  return data;
}

export async function removeMember(id) {
  const { data } = await apiClient.delete(`/members/${id}/`);
  return data;
}

export async function listRoles() {
  const { data } = await apiClient.get("/members/roles/");
  return data;
}

export async function searchMembers(query) {
  const { data } = await apiClient.get("/members/search/", { params: { q: query } });
  return data;
}