import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5002",
  withCredentials: false,
});

apiClient.interceptors.request.use(async (config) => {
  const authToken = localStorage.getItem("authToken");
  let serviceToken = localStorage.getItem("negotiationServiceToken");

  if (!serviceToken && authToken) {
    try {
      const res = await fetch("http://localhost:5002/api/token/exchange", {
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
    } catch (_) {}
  }

  const tokenToUse = serviceToken || authToken;
  if (tokenToUse) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${tokenToUse}`;
  }
  return config;
});

export default apiClient;

// Refresh on 401/403 and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config;
    if (!original || original.__retry) return Promise.reject(error);

    if (status === 401 || status === 403) {
    try {
      const rt = localStorage.getItem("refreshToken");
      const res = await fetch("http://localhost:5000/api/auth/refresh", {
          method: "POST",
          headers: rt ? { Authorization: `Bearer ${rt}` } : {},
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.accessToken) {
            localStorage.setItem("authToken", data.accessToken);
            // force service token re-exchange next request
            localStorage.removeItem("negotiationServiceToken");
            const token = data.accessToken;
            original.headers = original.headers || {};
            original.headers["Authorization"] = `Bearer ${token}`;
            original.__retry = true;
            return apiClient(original);
          }
        }
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);
