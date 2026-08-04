import { apiClient } from "./client";

export async function listRelationships() {
  const { data } = await apiClient.get("/family-tree/");
  return data;
}

export async function createRelationship({ from_member, to_member, relationship_type }) {
  const { data } = await apiClient.post("/family-tree/", {
    from_member,
    to_member,
    relationship_type,
  });
  return data;
}

export async function updateRelationship(id, relationship_type) {
  const { data } = await apiClient.patch(`/family-tree/${id}/`, { relationship_type });
  return data;
}

export async function deleteRelationship(id) {
  const { data } = await apiClient.delete(`/family-tree/${id}/`);
  return data;
}

export async function getFamilyTreeGraph() {
  const { data } = await apiClient.get("/family-tree/graph/");
  return data;
}