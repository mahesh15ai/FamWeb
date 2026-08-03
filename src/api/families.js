import { apiClient } from "./client";

export async function createFamily(formData) {
  const { data } = await apiClient.post("/families/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listFamilies() {
  const { data } = await apiClient.get("/families/");
  return data;
}

export async function getFamily(id) {
  const { data } = await apiClient.get(`/families/${id}/`);
  return data;
}

export async function getMyFamily() {
  const { data } = await apiClient.get("/families/my-family/");
  return data;
}

export async function updateFamily(id, formData) {
  const { data } = await apiClient.patch(`/families/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteFamily(id) {
  const { data } = await apiClient.delete(`/families/${id}/`);
  return data;
}
