import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAllUsers, fetchAllItems, fetchAllTrades, suspendUser, unsuspendUser, fetchPendingItems, approveItem, rejectItem } from "../api/adminApi.js";
import MarketplaceHome from "./MarketplaceHome.jsx";

const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_ACCENT = "#00BFA5";
const COLOR_TEXT_LIGHT = "white";

const BASE_STYLES = {
  background: `linear-gradient(135deg, #121212 0%, #000000 100%)`,
  fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', sans-serif",
  color: COLOR_TEXT_LIGHT,
  minHeight: "100vh",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [activeTab, setActiveTab] = useState("marketplace");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [trades, setTrades] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [itemActionMessage, setItemActionMessage] = useState("");
  const [itemActionType, setItemActionType] = useState("success");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUserId = localStorage.getItem("userId");
    if (!token || !storedUserId) {
      navigate("/login");
      return;
    }

    setCurrentAdminId(storedUserId);

    if (storedUserId !== userId) {
      // Prevent spoofing URL to another admin
      navigate(`/admin/${storedUserId}`);
      return;
    }

    fetchAllUsers().then(res => setUsers(res.data)).catch(() => {});
    fetchAllItems().then(res => setItems(res.data)).catch(() => {});
    fetchPendingItems().then(res => setPendingItems(res.data)).catch(() => {});
    fetchAllTrades().then(res => setTrades(res.data)).catch(() => {});
  }, [navigate, userId]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const mainContainerStyle = { ...BASE_STYLES, display: "flex", flexDirection: "row", alignItems: "stretch" };
  const sidebarStyle = { width: "250px", minHeight: "100vh", backgroundColor: COLOR_PRIMARY_DARK, padding: "1.5rem 1rem", boxShadow: "5px 0 15px rgba(0, 0, 0, 0.5)", display: "flex", flexDirection: "column", gap: "0.5rem" };
  const contentStyle = { flexGrow: 1, padding: "2rem", ...BASE_STYLES };
  const tabButtonStyle = (isActive) => ({
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: isActive ? COLOR_ACCENT : "transparent",
    color: isActive ? COLOR_PRIMARY_DARK : COLOR_TEXT_LIGHT,
    fontWeight: isActive ? 700 : 500,
    cursor: "pointer",
    textAlign: "left",
  });

  const [suspendAmount, setSuspendAmount] = useState(1);
  const [suspendUnit, setSuspendUnit] = useState("days");
  const [suspendReason, setSuspendReason] = useState("");
  const [customUntil, setCustomUntil] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(null); // userId while action in progress
  const [suspendTarget, setSuspendTarget] = useState(null); // user object for dialog

  const openSuspendDialog = (user) => {
    setSuspendTarget(user);
    setSuspendAmount(1);
    setSuspendUnit("days");
    setSuspendReason("");
    setCustomUntil("");
  };

  const closeSuspendDialog = () => {
    setSuspendTarget(null);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    setUserActionLoading(suspendTarget._id);
    try {
      await suspendUser(suspendTarget._id, {
        amount: customUntil ? undefined : suspendAmount,
        unit: customUntil ? undefined : suspendUnit,
        until: customUntil || undefined,
        reason: suspendReason || undefined,
      });
      const res = await fetchAllUsers();
      setUsers(res.data);
      closeSuspendDialog();
    } catch (_) {
      // keep silent in UI for now; could add toast later
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId) => {
    setUserActionLoading(userId);
    try {
      await unsuspendUser(userId);
      const res = await fetchAllUsers();
      setUsers(res.data);
    } catch (_) {
    } finally {
      setUserActionLoading(null);
    }
  };

  const renderUsers = () => (
    <div>
      <h2 style={{ color: COLOR_ACCENT, marginBottom: "0.75rem" }}>Users</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Username</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Email</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Role</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.filter(u => u._id !== currentAdminId).map(u => {
            const isSuspended = u.isSuspended && u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
            return (
              <tr key={u._id} style={{ borderTop: "1px solid #444" }}>
                <td style={{ padding: "0.5rem" }}>{u.username}</td>
                <td style={{ padding: "0.5rem" }}>{u.email}</td>
                <td style={{ padding: "0.5rem" }}>{u.role}</td>
                <td style={{ padding: "0.5rem" }}>
                  {isSuspended ? (
                    <span style={{ color: "#FFC107" }}>
                      Suspended until {new Date(u.suspendedUntil).toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: COLOR_ACCENT }}>Active</span>
                  )}
                </td>
                <td style={{ padding: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  {isSuspended ? (
                    <button
                      style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", border: "none", backgroundColor: COLOR_ACCENT, color: COLOR_PRIMARY_DARK, cursor: "pointer", fontSize: "0.8rem" }}
                      onClick={() => handleUnsuspend(u._id)}
                      disabled={userActionLoading === u._id}
                    >
                      {userActionLoading === u._id ? "Updating..." : "Cancel Suspension"}
                    </button>
                  ) : (
                    <button
                      style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", border: "none", backgroundColor: "#DC3545", color: COLOR_TEXT_LIGHT, cursor: "pointer", fontSize: "0.8rem" }}
                      onClick={() => openSuspendDialog(u)}
                      disabled={userActionLoading === u._id}
                    >
                      {userActionLoading === u._id ? "Updating..." : "Suspend"}
                    </button>
                  )}
                </td>
              </tr>
            );

          })}
        </tbody>
      </table>
    </div>
  );

  const renderItems = () => (
    <div>
      <h2 style={{ color: COLOR_ACCENT, marginBottom: "0.75rem" }}>Pending Items</h2>
      {pendingItems.length === 0 && (
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>No items are waiting for approval.</p>
      )}
      {pendingItems.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", marginBottom: "2rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Seller</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Submitted</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingItems.map(i => (
              <tr key={i._id} style={{ borderTop: "1px solid #444" }}>
                <td style={{ padding: "0.5rem" }}>{i.name}</td>
                <td style={{ padding: "0.5rem" }}>{String(i.seller).slice(0, 8)}...</td>
                <td style={{ padding: "0.5rem" }}>{new Date(i.createdAt).toLocaleString()}</td>
                <td style={{ padding: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <button
                    style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", border: "none", backgroundColor: COLOR_ACCENT, color: COLOR_PRIMARY_DARK, cursor: "pointer", fontSize: "0.8rem" }}
                    onClick={async () => {
                      try {
                        await approveItem(i._id);
                        const [allRes, pendingRes] = await Promise.all([
                          fetchAllItems(),
                          fetchPendingItems(),
                        ]);
                        setItems(allRes.data);
                        setPendingItems(pendingRes.data);
                        setItemActionType("success");
                        setItemActionMessage("Item approved and published to marketplace.");
                        setTimeout(() => setItemActionMessage(""), 3000);
                      } catch (_) {}
                    }}
                  >
                    Approve
                  </button>
                  <button
                    style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", border: "none", backgroundColor: "#DC3545", color: COLOR_TEXT_LIGHT, cursor: "pointer", fontSize: "0.8rem" }}
                    onClick={async () => {
                      const note = window.prompt("Reason for rejection? (optional)") || "";
                      try {
                        await rejectItem(i._id, note);
                        const [allRes, pendingRes] = await Promise.all([
                          fetchAllItems(),
                          fetchPendingItems(),
                        ]);
                        setItems(allRes.data);
                        setPendingItems(pendingRes.data);
                        setItemActionType("error");
                        setItemActionMessage("Item rejected.");
                        setTimeout(() => setItemActionMessage(""), 3000);
                      } catch (_) {}
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ color: COLOR_ACCENT, marginBottom: "0.75rem" }}>All Items</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Seller</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Listed</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i._id} style={{ borderTop: "1px solid #444" }}>
              <td style={{ padding: "0.5rem" }}>{i.name}</td>
              <td style={{ padding: "0.5rem" }}>{String(i.seller).slice(0, 8)}...</td>
              <td style={{ padding: "0.5rem" }}>{i.status || "approved"}</td>
              <td style={{ padding: "0.5rem" }}>{i.isListed ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTrades = () => (
    <div>
      <h2 style={{ color: COLOR_ACCENT }}>Trades</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Initiator</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Receiver</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t._id} style={{ borderTop: "1px solid #444" }}>
              <td style={{ padding: "0.5rem" }}>{t.initiator?.username}</td>
              <td style={{ padding: "0.5rem" }}>{t.receiver?.username}</td>
              <td style={{ padding: "0.5rem" }}>{t.status}</td>
              <td style={{ padding: "0.5rem" }}>{new Date(t.lastActivity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={mainContainerStyle}>
      {itemActionMessage && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            backgroundColor: itemActionType === "success" ? "#00BFA5" : "#DC3545",
            color: COLOR_PRIMARY_DARK,
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
            fontSize: "0.85rem",
            zIndex: 1500,
          }}
        >
          {itemActionMessage}
        </div>
      )}
      {suspendTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: COLOR_PRIMARY_DARK,
              padding: "1.5rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.7)",
              color: COLOR_TEXT_LIGHT,
              fontSize: "0.9rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: COLOR_ACCENT }}>
              Suspend {suspendTarget.username}
            </h3>
            <p style={{ marginTop: 0, marginBottom: "0.75rem", opacity: 0.8 }}>
              Choose how long this account will be suspended and optionally add a reason.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                type="number"
                min={1}
                value={suspendAmount}
                onChange={(e) => setSuspendAmount(Number(e.target.value))}
                style={{ width: "70px", padding: "0.25rem 0.4rem", borderRadius: "6px", border: "1px solid #555", backgroundColor: "#1f1f1f", color: COLOR_TEXT_LIGHT }}
              />
              <select
                value={suspendUnit}
                onChange={(e) => setSuspendUnit(e.target.value)}
                style={{ flexGrow: 1, padding: "0.25rem 0.4rem", borderRadius: "6px", border: "1px solid #555", backgroundColor: "#1f1f1f", color: COLOR_TEXT_LIGHT }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
              <input
                type="datetime-local"
                value={customUntil}
                onChange={(e) => setCustomUntil(e.target.value)}
                style={{ padding: "0.25rem 0.4rem", borderRadius: "6px", border: "1px solid #555", backgroundColor: "#1f1f1f", color: COLOR_TEXT_LIGHT }}
              />
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Leave blank to use the duration above.
              </span>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                style={{ padding: "0.25rem 0.5rem", borderRadius: "6px", border: "1px solid #555", backgroundColor: "#1f1f1f", color: COLOR_TEXT_LIGHT }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #555", backgroundColor: "transparent", color: COLOR_TEXT_LIGHT, cursor: "pointer", fontSize: "0.85rem" }}
                onClick={closeSuspendDialog}
                disabled={userActionLoading === suspendTarget._id}
              >
                Cancel
              </button>
              <button
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "none", backgroundColor: "#DC3545", color: COLOR_TEXT_LIGHT, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                onClick={handleConfirmSuspend}
                disabled={userActionLoading === suspendTarget._id}
              >
                {userActionLoading === suspendTarget._id ? "Suspending..." : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
      <aside style={sidebarStyle}>
        <h2 style={{ marginBottom: "1rem", color: COLOR_ACCENT }}>Admin Panel</h2>
        <button style={tabButtonStyle(activeTab === "marketplace")} onClick={() => setActiveTab("marketplace")}>
          Marketplace
        </button>
        <button style={tabButtonStyle(activeTab === "users")} onClick={() => setActiveTab("users")}>
          User lists
        </button>
        <button style={tabButtonStyle(activeTab === "items")} onClick={() => setActiveTab("items")}>
          Items
        </button>
        <button style={tabButtonStyle(activeTab === "trades")} onClick={() => setActiveTab("trades")}>
          Trades
        </button>
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #444", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            style={{ ...tabButtonStyle(false), width: "100%" }}
            onClick={() => navigate(`/dashboard/${userId}`)}
          >
            Back to Dashboard
          </button>
          <button
            style={{ ...tabButtonStyle(false), width: "100%", backgroundColor: "#DC3545", color: COLOR_TEXT_LIGHT, fontWeight: 700 }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>
      <main style={contentStyle}>
        {activeTab === "marketplace" && <MarketplaceHome canTrade={false} />}
        {activeTab === "users" && renderUsers()}
        {activeTab === "items" && renderItems()}
        {activeTab === "trades" && renderTrades()}
      </main>
    </div>
  );
}
