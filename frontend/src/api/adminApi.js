import axios from 'axios';
const AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:5001';
const NEGOTIATION_API = import.meta.env.VITE_NEGOTIATION_API_URL || 'http://localhost:5002';

// Admin APIs (includes read-only views and moderation actions)

export const fetchAllUsers = () => {
  const token = localStorage.getItem('authToken');
  return axios.get(`${AUTH_API}/api/admin/users`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
};

export const suspendUser = (userId, { amount, unit, reason, until }) => {
  const token = localStorage.getItem('authToken');
  return axios.post(
    `${AUTH_API}/api/admin/users/${userId}/suspend`,
    { amount, unit, reason, until },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    },
  );
};

export const unsuspendUser = (userId) => {
  const token = localStorage.getItem('authToken');
  return axios.post(
    `${AUTH_API}/api/admin/users/${userId}/unsuspend`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    },
  );
};

export const fetchAllItems = () => {
  const token = localStorage.getItem('authToken');
  return axios.get(`${PRODUCT_API}/api/admin/items`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const fetchAllTrades = () => {
  const token = localStorage.getItem('authToken');
  return axios.get(`${NEGOTIATION_API}/api/admin/trades`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const fetchPendingItems = () => {
  const token = localStorage.getItem('authToken');
  return axios.get(`${PRODUCT_API}/api/admin/items/pending`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const approveItem = (itemId) => {
  const token = localStorage.getItem('authToken');
  return axios.post(
    `${PRODUCT_API}/api/admin/items/${itemId}/approve`,
    {},
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
};

export const rejectItem = (itemId, note) => {
  const token = localStorage.getItem('authToken');
  return axios.post(
    `${PRODUCT_API}/api/admin/items/${itemId}/reject`,
    { note },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
};
