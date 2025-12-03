import axios from "axios";

const NEGOTIATION_API = import.meta.env.VITE_NEGOTIATION_API_URL || "http://localhost:5002";
const AUTH_API = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: NEGOTIATION_API,
  withCredentials: false,
});

apiClient.interceptors.request.use(async (config) => {
  const authToken = localStorage.getItem("authToken");
  let serviceToken = localStorage.getItem("negotiationServiceToken");

  if (!serviceToken && authToken) {
    try {
      const res = await fetch(`${NEGOTIATION_API}/api/token/exchange`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem("negotiationServiceToken", data.token);
          serviceToken = data.token;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const tokenToUse = serviceToken || authToken;
  if (tokenToUse) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${tokenToUse}`;
  }
  return config;
});

export default apiClient;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config;
    if (!original || original.__retry) return Promise.reject(error);

    if (status === 401 || status === 403) {
      try {
        const rt = localStorage.getItem("refreshToken");
        const res = await fetch(`${AUTH_API}/api/auth/refresh`, {
          method: "POST",
          headers: rt ? { Authorization: `Bearer ${rt}` } : {},
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.accessToken) {
            localStorage.setItem("authToken", data.accessToken);
            localStorage.removeItem("negotiationServiceToken");
            const token = data.accessToken;
            original.headers = original.headers || {};
            original.headers["Authorization"] = `Bearer ${token}`;
            original.__retry = true;
            return apiClient(original);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return Promise.reject(error);
  }
);
