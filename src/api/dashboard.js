import { apiClient } from "./client";

export async function getOverview() {
  const response = await apiClient.get("dashboard/");
  return response.data;
}

export async function getStatistics() {
  const response = await apiClient.get("dashboard/statistics/");
  return response.data;
}

export async function getRecentActivities() {
  const response = await apiClient.get("dashboard/recent-activities/");
  return response.data;
}

export async function getUpcomingEvents() {
  const response = await apiClient.get("dashboard/upcoming-events/");
  return response.data;
}

export async function getBirthdays() {
  const response = await apiClient.get("dashboard/birthdays/");
  return response.data;
}



