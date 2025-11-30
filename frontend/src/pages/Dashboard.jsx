import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from "axios";
import { refreshToken } from "../api/authApi.js";
import { PlusCircle, User, Home, MessageSquare, LogOut, Shield } from "lucide-react";

import MarketplaceHome from "./MarketplaceHome.jsx";
import UserProfileContent from "./UserProfileContent.jsx";
import AddItemContent from "./AddItemContent.jsx";
import TradeInbox from "./TradeInbox.jsx";
import TradeDetail from "./TradeDetail.jsx";

const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_ACCENT = "#00BFA5";
const COLOR_TEXT_LIGHT = "white";
const COLOR_DANGER = "#DC3545";

const BASE_STYLES = {
  background: `linear-gradient(135deg, #121212 0%, #000000 100%)`,
  fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif",
  color: COLOR_TEXT_LIGHT,
  minHeight: "100vh",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId } = useParams(); // ✅ Correct location
  const location = useLocation();
  const [user, setUser] = useState(null); // store fetched user
  const [currentView, setCurrentView] = useState("Home");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [suspensionInfo, setSuspensionInfo] = useState(null);
  const [itemToast, setItemToast] = useState("");

  // ✅ Fetch user on load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }
        const doFetch = async (bearer) => {
          return axios.get(`http://localhost:5000/api/users/${userId}`, {
            headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
            withCredentials: true,
          });
        };

        let res = await doFetch(token);
        setUser(res.data);
        try {
          const existing = JSON.parse(localStorage.getItem('user') || 'null');
          localStorage.setItem('user', JSON.stringify({ ...(existing || {}), ...res.data }));
        } catch {}
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          try {
            const data = await refreshToken();
            const newToken = data.accessToken;
            if (newToken) {
              localStorage.setItem('authToken', newToken);
              const res2 = await axios.get(`http://localhost:5000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${newToken}` }
              });
              setUser(res2.data);
              try {
                const existing = JSON.parse(localStorage.getItem('user') || 'null');
                localStorage.setItem('user', JSON.stringify({ ...(existing || {}), ...res2.data }));
              } catch {}
              return;
            }
          } catch (refreshErr) {
            console.error("Token refresh failed:", refreshErr);
            navigate('/login');
          }
        }
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  // Poll suspension status periodically so that if an admin suspends this user
  // while they are on the dashboard, they see a warning without auto-logout.
  useEffect(() => {
    if (!userId) return;

    const checkSuspension = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = res.data;
        if (u.isSuspended && u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) {
          setSuspensionInfo({
            until: u.suspendedUntil,
            reason: u.suspensionReason || null,
          });
        } else {
          setSuspensionInfo(null);
        }
      } catch {
        // ignore
      }
    };

    checkSuspension();
    const interval = setInterval(checkSuspension, 5000); // every 5s
    return () => clearInterval(interval);
  }, [userId]);

  // View routing via query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    const tradeParam = params.get('trade');

    if (viewParam === 'Inbox') {
      setCurrentView('Inbox');
    }
    if (tradeParam) {
      setSelectedTrade(tradeParam);
      setCurrentView('TradeDetail');
    } else {
      const active = localStorage.getItem('activeTradeId');
      if (active) {
        setSelectedTrade(active);
        setCurrentView('TradeDetail');
        localStorage.removeItem('activeTradeId');
      }
    }
  }, [userId, location.search]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const handleViewTrade = tradeId => {
    setSelectedTrade(tradeId);
    setCurrentView('TradeDetail');
  };

  const handleItemUploadSuccess = () => {
    setCurrentView("Home");
    setItemToast("Your item was submitted and is now pending admin approval.");
    setTimeout(() => setItemToast(""), 3000);
  };

  const renderContent = () => {
    if (user?.role === 'admin') {
      return (
        <div style={{ padding: '2rem' }}>
          <h2 style={{ color: COLOR_ACCENT, marginBottom: '0.75rem' }}>Admin account</h2>
          <p style={{ opacity: 0.85, marginBottom: '1.5rem' }}>
            This account is restricted to administrative operations only. Use the Admin Panel to manage users, items, and trades.
          </p>
          <button
            style={{
              padding: '0.7rem 1.2rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: COLOR_ACCENT,
              color: COLOR_PRIMARY_DARK,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/admin/${user._id}`)}
          >
            Go to Admin Panel
          </button>
        </div>
      );
    }

    switch (currentView) {
      case "AddItem": return <AddItemContent onSuccess={handleItemUploadSuccess} />;
      case "Profile": return <UserProfileContent user={user} />;
      case "Inbox": return <TradeInbox onSelectTrade={handleViewTrade} />;
      case "TradeDetail": 
        return selectedTrade 
          ? <TradeDetail tradeId={selectedTrade} onBack={() => setCurrentView('Inbox')} />
          : <MarketplaceHome />;
      case "Home":
      default: return <MarketplaceHome />;
    }
  };

  const mainContainerStyle = {
    ...BASE_STYLES,
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
  };
  const sidebarStyle = { width: "250px", minHeight: "100vh", backgroundColor: COLOR_PRIMARY_DARK, padding: "1.5rem 1rem", boxShadow: "5px 0 15px rgba(0, 0, 0, 0.5)", display: "flex", flexDirection: "column", gap: "0.5rem" };
  const contentStyle = { flexGrow: 1, padding: "2rem", ...BASE_STYLES, overflowY: "auto" };
  const navButtonStyle = (isActive, isLogout = false) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.8rem 1rem",
    borderRadius: "8px",
    backgroundColor: isLogout ? COLOR_DANGER : (isActive ? COLOR_ACCENT : 'transparent'),
    color: isLogout ? COLOR_TEXT_LIGHT : (isActive ? COLOR_PRIMARY_DARK : COLOR_TEXT_LIGHT),
    fontWeight: isLogout || isActive ? 700 : 500,
    cursor: "pointer",
    border: 'none',
    textAlign: 'left',
  });

  return (
    <div style={mainContainerStyle}>
      {itemToast && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            backgroundColor: "#00BFA5",
            color: COLOR_PRIMARY_DARK,
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
            fontSize: "0.85rem",
            zIndex: 1400,
          }}
        >
          {itemToast}
        </div>
      )}
      {suspensionInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(220,53,69,0.98), rgba(120,0,20,0.98))",
              color: COLOR_TEXT_LIGHT,
              padding: "1.5rem 2rem",
              borderRadius: "16px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
              maxWidth: "480px",
              width: "90%",
              textAlign: "left",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Account Suspended</h2>
            <p style={{ margin: 0, marginBottom: "0.5rem", fontSize: "0.95rem" }}>
              {`Until: ${new Date(suspensionInfo.until).toLocaleString()}`}
            </p>
            {suspensionInfo.reason && (
              <p style={{ margin: 0, marginBottom: "1rem", fontSize: "0.95rem" }}>
                {`Reason: ${suspensionInfo.reason}`}
              </p>
            )}
            <p style={{ margin: 0, marginBottom: "1.2rem", fontSize: "0.85rem", opacity: 0.9 }}>
              You can no longer use this account until the suspension ends. Please log out.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: COLOR_TEXT_LIGHT,
                  color: COLOR_DANGER,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      <aside style={sidebarStyle}>
        <h2 style={{ marginBottom: "0.5rem", color: COLOR_ACCENT }}>SWAP.TA</h2>

        {/* Display logged user avatar + name */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#444",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              {user.avatar ? (
                <img
                  src={`http://localhost:5000/${user.avatar}`}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{user.username?.charAt(0)?.toUpperCase() || "?"}</span>
              )}
            </div>
            <p style={{ color: "#aaa", margin: 0 }}>
              Hello, <strong>{user.username}</strong>
            </p>
          </div>
        )}

        <button style={navButtonStyle(currentView === "Home")} onClick={() => { setCurrentView("Home"); setSelectedTrade(null); }}><Home size={20} /> Marketplace</button>
        {user?.role !== 'admin' && (
          <>
            <button style={navButtonStyle(currentView === "AddItem")} onClick={() => { setCurrentView("AddItem"); setSelectedTrade(null); }}><PlusCircle size={20} /> Add Item</button>
            <button style={navButtonStyle(currentView === "Profile")} onClick={() => { setCurrentView("Profile"); setSelectedTrade(null); }}><User size={20} /> My Profile</button>
            <button style={navButtonStyle(currentView === "Inbox" || currentView === "TradeDetail")} onClick={() => { setCurrentView("Inbox"); setSelectedTrade(null); }}><MessageSquare size={20} /> Negotiations (Inbox)</button>
          </>
        )}
        <button style={navButtonStyle(false, true)} onClick={handleLogout}><LogOut size={20} /> Logout</button>

        {user?.role === 'admin' && (
          <button
            style={navButtonStyle(false)}
            onClick={() => navigate(`/admin/${user._id}`)}
          >
            <Shield size={20} /> Admin Panel
          </button>
        )}
      </aside>

      <main style={contentStyle}>{renderContent()}</main>
    </div>
  );
}
