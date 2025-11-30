import apiClient from "./apiClient";

// Send a new message
export const sendMessage = async (data) => {
  return apiClient.post("/api/messages", data);
};

// Fetch chat messages for a trade room
export const getMessages = async (tradeId) => {
  return apiClient.get(`/api/messages/${tradeId}`);
};
