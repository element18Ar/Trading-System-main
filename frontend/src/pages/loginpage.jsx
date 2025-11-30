import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

// Custom hook to detect screen size
const useScreenSize = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;
  return { width, isMobile };
};

// --- API CALL FUNCTION ---
const loginUser = async (data) => {
  return await axios.post("http://localhost:5000/api/auth/login", data, {
    withCredentials: true, // send cookies
  });
};

export default function Login() {
  const { isMobile } = useScreenSize();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Colors
  const COLOR_PRIMARY_DARK = "#2C2D2D";
  const COLOR_CARD_BG = "#3E3F3F";
  const COLOR_ACCENT = "#00BFA5";
  const COLOR_INPUT_BG = "#303030";
  const COLOR_INPUT_BORDER = "#8A8C8C";
  const COLOR_TEXT_LIGHT = "white";

  // Responsive style
  const cardPadding = isMobile ? "2rem 1.5rem" : "2.5rem 2.5rem";
  const containerPadding = isMobile ? "1rem" : "2rem";
  const inputHeight = isMobile ? "2.8rem" : "3.2rem";
  const buttonFontSize = isMobile ? "1.05rem" : "1.2rem";

  const inputStyle = {
    width: "100%",
    height: inputHeight,
    padding: "0 12px",
    paddingRight: "40px",
    backgroundColor: COLOR_INPUT_BG,
    color: COLOR_TEXT_LIGHT,
    border: `1px solid ${COLOR_INPUT_BORDER}`,
    borderRadius: "8px",
    fontSize: "1rem",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = COLOR_ACCENT;
    e.target.style.boxShadow = `0 0 0 2px rgba(0, 191, 165, 0.5)`;
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = COLOR_INPUT_BORDER;
    e.target.style.boxShadow = "none";
  };

  // Prefill email if just registered
  useEffect(() => {
    const registeredEmail = localStorage.getItem("registeredEmail");
    if (registeredEmail) {
      setEmailOrUsername(registeredEmail);
      localStorage.removeItem("registeredEmail");
    }
  }, []);

  // Auto-clear suspension toast after 5 seconds
  useEffect(() => {
    if (!suspensionInfo) return;
    const timer = setTimeout(() => setSuspensionInfo(null), 5000);
    return () => clearTimeout(timer);
  }, [suspensionInfo]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ Send email (must match backend)
      const response = await loginUser({
        email: emailOrUsername,
        password,
      });

      localStorage.setItem("authToken", response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      localStorage.setItem("userId", response.data.user._id);
      localStorage.setItem("user", JSON.stringify(response.data.user)); //newly addded

      // Obtain a service-scoped token for product-service (optional optimization)
      try {
        const exRes = await fetch("http://localhost:5001/api/token/exchange", {
          method: "POST",
          headers: { Authorization: `Bearer ${response.data.accessToken}` },
        });
        if (exRes.ok) {
          const ex = await exRes.json();
          if (ex?.token) localStorage.setItem("productServiceToken", ex.token);
        }
      } catch {}

      console.log("Login successful!", response.data);
      navigate(`/dashboard/${response.data.user._id}`); //newly added
    } catch (err) {
      console.error("Login failed:", err.response || err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 403 && data?.message === "Account is suspended") {
        const until = data.suspendedUntil
          ? new Date(data.suspendedUntil).toLocaleString()
          : null;
        const reason = data.suspensionReason;
        let msg = "This account has been suspended";
        if (until) msg += ` until ${until}`;
        if (reason) msg += ` — Reason: ${reason}`;
        setSuspensionInfo(msg);
        setError(null);
      } else {
        setError(
          data?.message || "Login failed. Please check your credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: `linear-gradient(135deg, #121212 0%, #000000 100%)`,
        padding: containerPadding,
        fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* LOGIN CARD */}
      <div
        style={{
          backgroundColor: COLOR_CARD_BG,
          padding: cardPadding,
          borderRadius: "20px",
          color: COLOR_TEXT_LIGHT,
          maxWidth: "400px",
          width: isMobile ? "90%" : "100%",
          textAlign: "center",
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.6)",
          zIndex: 1,
        }}
      >
        {suspensionInfo && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background:
                "linear-gradient(135deg, rgba(220,53,69,0.95), rgba(120,0,20,0.95))",
              color: "#fff",
              fontSize: "0.9rem",
              textAlign: "left",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {suspensionInfo}
          </div>
        )}
        <header style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              color: COLOR_TEXT_LIGHT,
              fontSize: isMobile ? "2rem" : "2.5rem",
              fontWeight: 800,
              margin: 0,
            }}
          >
            Welcome Back
          </h1>
          <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
            Sign in to access your trades.
          </p>
        </header>

        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

        <form
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <input
            type="text"
            placeholder="Email"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Password */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, width: "100%", paddingRight: "40px" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: COLOR_ACCENT,
                padding: "0.2rem",
                zIndex: 2,
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: COLOR_ACCENT,
              padding: "1.1rem 2.8rem",
              color: COLOR_PRIMARY_DARK,
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: buttonFontSize,
              fontWeight: 700,
              width: "100%",
              marginTop: "1rem",
              transition: "background-color 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease",
              boxShadow: "0 4px 15px rgba(0, 191, 165, 0.4)",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#00E0C0";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(0, 191, 165, 0.6)";
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = COLOR_ACCENT;
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(0, 191, 165, 0.4)";
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Link to Register */}
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.8 }}>
          Need an account?{" "}
          <Link
            to="/register"
            style={{
              color: COLOR_ACCENT,
              textDecoration: "none",
              fontWeight: 600,
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.opacity = 0.8)}
            onMouseOut={(e) => (e.target.style.opacity = 1)}
          >
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}