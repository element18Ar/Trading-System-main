import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Importing icons for navigation

// Custom hook to detect screen size for responsive styling
const useScreenSize = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define a breakpoint for tablet/mobile
  const isMobile = width < 992;
  return { width, isMobile };
};

export default function Homepage() {
  const { isMobile } = useScreenSize();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define Colors for easy reference and consistency (Same as original)
  const COLOR_PRIMARY_DARK = "#2C2D2D";
  const COLOR_CARD_BG = "#3E3F3F";
  const COLOR_ACCENT = "#00BFA5"; // Vibrant Teal/Cyan
  const COLOR_SECONDARY_BUTTON_BORDER = "#8A8C8C";

  // Responsive Style Variables
  const h1FontSize = isMobile ? "2.5rem" : "4.5rem"; // Even larger for impact
  const h2FontSize = isMobile ? "1.2rem" : "1.5rem";
  const buttonFontSize = isMobile ? "1rem" : "1.1rem";

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: `linear-gradient(135deg, #121212 0%, #000000 100%)`,
        fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif",
        color: "white",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 2rem",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black
          borderBottom: `1px solid ${COLOR_PRIMARY_DARK}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h3 style={{ margin: 0, color: COLOR_ACCENT, fontWeight: 800, letterSpacing: "1px" }}>
          SWAP.TA
        </h3>

        {/* Desktop Links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <Link to="/" style={{ color: "white", textDecoration: "none", opacity: 0.8 }}>
              Features
            </Link>
            <Link to="/" style={{ color: "white", textDecoration: "none", opacity: 0.8 }}>
              How It Works
            </Link>
            <Link to="/" style={{ color: "white", textDecoration: "none", opacity: 0.8 }}>
              Contact
            </Link>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${COLOR_SECONDARY_BUTTON_BORDER}`,
                  padding: "0.5rem 1.5rem",
                  color: "white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                Login
              </button>
            </Link>
          </div>
        )}

        {/* Mobile Menu Icon */}
        {isMobile && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        )}
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobile && isMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "5.5rem", // Below the nav bar
            width: "100%",
            backgroundColor: COLOR_PRIMARY_DARK,
            zIndex: 9,
            padding: "1rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Link to="/" style={{ color: "white", textDecoration: "none", padding: "0.5rem 0" }}>
            Features
          </Link>
          <Link to="/" style={{ color: "white", textDecoration: "none", padding: "0.5rem 0" }}>
            How It Works
          </Link>
          <Link to="/" style={{ color: "white", textDecoration: "none", padding: "0.5rem 0" }}>
            Contact
          </Link>
          <Link to="/login" style={{ textDecoration: "none", marginTop: "0.5rem" }}>
            <button
              style={{
                backgroundColor: "transparent",
                border: `1px solid ${COLOR_SECONDARY_BUTTON_BORDER}`,
                padding: "0.8rem",
                color: "white",
                borderRadius: "8px",
                width: "100%",
              }}
            >
              Login
            </button>
          </Link>
        </div>
      )}

      {/* 2. MAIN SPLIT LAYOUT (Hero Content) */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "2rem" : "5rem 4rem",
          minHeight: isMobile ? "auto" : "calc(100vh - 5.5rem)", // Adjust for nav height
          textAlign: isMobile ? "center" : "left",
          gap: isMobile ? "3rem" : "0",
        }}
      >
        {/* Left Side: Title and Description */}
        <div style={{
          maxWidth: isMobile ? "100%" : "50%",
          paddingRight: isMobile ? "0" : "4rem",
        }}>
          <h1
            style={{
              margin: 0,
              fontSize: h1FontSize,
              fontWeight: 900, // Ultra bold
              lineHeight: 1.1,
              color: "white",
              textShadow: `0 0 10px rgba(0, 191, 165, 0.3)`,
            }}
          >
            The <span style={{ color: COLOR_ACCENT }}>Future</span> of Exchange.
          </h1>
          <h2
            style={{
              fontSize: h2FontSize,
              marginTop: "1rem",
              color: COLOR_ACCENT,
              fontWeight: 500,
            }}
          >
            Trade What You Have, Get What You Need.
          </h2>

          <p
            style={{
              opacity: 0.8,
              marginTop: "1.5rem",
              lineHeight: "1.7",
              maxWidth: "500px",
              margin: isMobile ? "1.5rem auto 0" : "1.5rem 0 0",
            }}
          >
            Connect with a vibrant community ready to swap skills, services, and physical items effortlessly, completely
            {/* Highlighted text using an inline style span */}
            <span style={{ color: COLOR_ACCENT, fontWeight: 'bold' }}> without cash</span>.
            Redefine value through bartering.
          </p>

          {/* CTA Buttons below text */}
          <div
            style={{
              display: "flex",
              gap: "1.2rem",
              marginTop: "2.5rem",
              justifyContent: isMobile ? "center" : "flex-start",
            }}
          >
            {/* PRIMARY CTA: GET STARTED (Register) */}
            <Link to="/register" style={{ textDecoration: "none" }}>
              <button
                style={{
                  backgroundColor: COLOR_ACCENT,
                  padding: "0.9rem 2rem",
                  color: COLOR_PRIMARY_DARK,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: buttonFontSize,
                  fontWeight: 700,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(0, 191, 165, 0.4)",
                }}
                onMouseOver={(e) => { e.target.style.backgroundColor = "#00E0C0"; e.target.style.transform = "translateY(-1px)"; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = COLOR_ACCENT; e.target.style.transform = "translateY(0)"; }}
              >
                Start Swapping
              </button>
            </Link>

            {/* SECONDARY CTA: Learn More */}
            <Link to="/about" style={{ textDecoration: "none" }}>
              <button
                style={{
                  backgroundColor: "transparent",
                  border: `2px solid ${COLOR_SECONDARY_BUTTON_BORDER}`,
                  padding: "0.9rem 2rem",
                  color: "white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: buttonFontSize,
                  fontWeight: 500,
                  transition: "background-color 0.3s ease",
                }}
                onMouseOver={(e) => { e.target.style.backgroundColor = COLOR_SECONDARY_BUTTON_BORDER; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = "transparent"; }}
              >
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Placeholder / Illustration */}
        {!isMobile && (
          <div
            style={{
              width: "45%",
              aspectRatio: "1/1",
              backgroundColor: COLOR_CARD_BG,
              borderRadius: "50%", // Circular element
              display: "flex", // Keep flex for centering if image isn't perfect
              alignItems: "center",
              justifyContent: "center",
              border: `4px solid ${COLOR_ACCENT}`,
              boxShadow: `0 0 40px rgba(0, 191, 165, 0.2)`, // Subtle glow
              overflow: "hidden", // Crucial: clips image to the circle
              position: "relative", // Needed if you want overlays/absolute positioning later
            }}
          >
            {/* Replace the <span> with an <img> tag */}
            <img
              src="/src/image/CADY.png.png"
              alt="Visual Representation"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />

          </div>

        )}
      </div>

    </div>
  );
} 