import apiClient from "./client";

// Get events list (optional filterType: 'upcoming' | 'past')
export const getEvents = async (filterType = "") => {
  const url = filterType ? `/events/?type=${filterType}` : "/events/";
  const response = await apiClient.get(url);
  return response.data;
};

// Create new event
export const createEvent = async (eventData) => {
  const response = await apiClient.post("/events/", eventData);
  return response.data;
};

// Update event
export const updateEvent = async (eventId, eventData) => {
  const response = await apiClient.put(`/events/${eventId}/`, eventData);
  return response.data;
};

// Delete event
export const deleteEvent = async (eventId) => {
  const response = await apiClient.delete(`/events/${eventId}/`);
  return response.data;
};