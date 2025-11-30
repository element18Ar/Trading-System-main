import apiClient from "./apiClient";

// Create a new trade
export const createTrade = async (data) => {
  return apiClient.post("/api/trades", data);
};

// Get inbox (all trades of a user)
export const getUserTrades = async (userId) => {
  return apiClient.get(`/api/trades/user/${userId}`);
};

// Get specific trade details
export const getTradeDetails = async (tradeId) => {
  return apiClient.get(`/api/trades/${tradeId}`);
};

// Update offer (add/remove items or cash)
export const updateTradeOffer = async (tradeId, data) => {
  return apiClient.put(`/api/trades/${tradeId}/offer`, data);
};

// Update trade status (accepted, completed, rejected)
export const updateTradeStatus = async (tradeId, data) => {
  return apiClient.patch(`/api/trades/${tradeId}/status`, data);
};
