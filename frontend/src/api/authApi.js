const AUTH_API = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000";
const BACKEND_URL = `${AUTH_API}/api/auth`;

// ----------------------------
// Register a new user
// ----------------------------
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed.");
    }

    return response.json();
  } catch (error) {
    console.error("Registration API Error:", error.message);
    throw error;
  }
};

// ----------------------------
// Login user
// ----------------------------
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include", // Needed if backend sets HTTP-only cookies (refresh token)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed.");
    }

    return response.json();
  } catch (error) {
    console.error("Login API Error:", error.message);
    throw error;
  }
};

// ----------------------------
// Refresh Access Token
// ----------------------------
export const refreshToken = async () => {
  try {
    const rt = localStorage.getItem("refreshToken");
    const response = await fetch(`${BACKEND_URL}/refresh`, {
      method: "POST",
      headers: rt ? { Authorization: `Bearer ${rt}` } : {},
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to refresh token.");
    }

    return response.json();
  } catch (error) {
    console.error("Refresh Token API Error:", error.message);
    throw error;
  }
};
