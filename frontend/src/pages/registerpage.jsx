import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi.js";

// Custom hook to detect screen size for responsive styling
const useScreenSize = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768; 
  return { width, isMobile };
};

// API call moved to shared client in ../api/authApi.js

export default function Register() {
  const { isMobile } = useScreenSize();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser(formData);
      const email = response?.user?.email || formData.email;
      localStorage.setItem("registeredEmail", email);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      const message = err?.message || 'Network error. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- COLORS ---
  const COLOR_PRIMARY_DARK = "#2C2D2D"; 
  const COLOR_CARD_BG = "#3E3F3F"; 
  const COLOR_ACCENT = "#00BFA5"; 
  const COLOR_INPUT_BG = "#303030"; 
  const COLOR_INPUT_BORDER = "#8A8C8C"; 
  const COLOR_TEXT_LIGHT = "white"; 

  const cardPadding = isMobile ? "2rem 1.5rem" : "2.5rem 2.5rem"; 
  const containerPadding = isMobile ? "1rem" : "2rem";
  const inputHeight = isMobile ? "2.8rem" : "3.2rem";
  const buttonFontSize = isMobile ? "1.05rem" : "1.2rem";

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
      {/* Background Texture */}
      <div 
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 2 2"><rect x="0" y="0" width="1" height="1" fill="%23222" opacity="0.05"/><rect x="1" y="1" width="1" height="1" fill="%23222" opacity="0.05"/></svg>')`,
          backgroundSize: '8px 8px',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      ></div>

      {/* REGISTRATION CARD */}
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
        <header style={{ marginBottom: "2rem" }}>
          <h1 
            style={{ 
              color: COLOR_TEXT_LIGHT,
              fontSize: isMobile ? "2rem" : "2.5rem",
              fontWeight: 800,
              margin: 0,
            }}
          >
            Create Account
          </h1>
          <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
            Join the modern bartering community.
          </p>
        </header>

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form 
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onSubmit={handleSubmit}
        >
          {[ 
            { label: "Username", name: "username", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Password", name: "password", type: "password" },
            { label: "Confirm Password", name: "confirmPassword", type: "password" },
          ].map((field, index) => (
            <input
              key={index}
              name={field.name}
              type={field.type}
              placeholder={field.label}
              value={formData[field.name]}
              onChange={handleChange}
              style={{
                width: "calc(100% - 24px)",
                height: inputHeight,
                padding: "0 12px",
                backgroundColor: COLOR_INPUT_BG,
                color: COLOR_TEXT_LIGHT,
                border: `1px solid ${COLOR_INPUT_BORDER}`,
                borderRadius: "8px",
                fontSize: "1rem",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLOR_ACCENT;
                e.target.style.boxShadow = `0 0 0 2px rgba(0, 191, 165, 0.5)`; 
              }}
              onBlur={(e) => {
                e.target.style.borderColor = COLOR_INPUT_BORDER;
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}

          {/* REGISTER BUTTON */}
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
            {loading ? "Registering..." : "Register Now"}
          </button>
        </form>

        {/* Link to Login */}
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.8 }}>
          Already have an account?{" "}
          <Link 
            to="/login" 
            style={{ 
              color: COLOR_ACCENT, 
              textDecoration: "none", 
              fontWeight: 600,
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.target.style.opacity = 0.8}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
