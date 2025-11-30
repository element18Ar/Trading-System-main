import React, { useState, useEffect } from "react";
import { List } from "lucide-react";
import { getUserTrades } from "../api/tradeApi.js";

// --- 🎨 STYLE CONSTANTS ---
const COLOR_ACCENT = "#00BFA5";
const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_CARD_BG = "#3E3F3F";

export default function TradeInbox({ onSelectTrade }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId"); // Must be available from login

  const fetchTrades = async () => {
    if (!userId) {
      console.error("User ID not found in localStorage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getUserTrades(userId);
      setTrades(res.data);
    } catch (error) {
      console.error("Error fetching trades:", error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const getPartner = (trade) => {
    if (!trade?.initiator || !trade?.receiver) return { username: 'Unknown' };
    const isInitiator = String(trade.initiator._id) === String(userId);
    return isInitiator ? trade.receiver : trade.initiator;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted': return { color: '#22c55e', fontWeight: 'bold', label: 'Accepted' };
      case 'rejected': return { color: '#ef4444', fontWeight: 'bold', label: 'Rejected' };
      case 'completed': return { color: '#22c55e', fontWeight: 'bold', label: 'Completed' };
      case 'cancelled': return { color: '#9ca3af', fontWeight: 'bold', label: 'Cancelled' };
      case 'negotiating': return { color: COLOR_ACCENT, label: 'Negotiating' };
      case 'proposed':
      default:
        return { color: '#eab308', label: 'Proposed' };
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <List size={24} />
        <span>Trade Negotiations Inbox</span>
      </h2>
      <p style={{ opacity: 0.8, marginBottom: '20px', fontSize: '0.9rem' }}>All your active and past trade proposals, sorted by most recent activity.</p>

      {loading && <p>Loading negotiations...</p>}
      
      {!loading && trades.length === 0 && <p>You have no active or archived trades.</p>}

      {!loading && trades.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trades.map(trade => {
            const partner = getPartner(trade);
            const isInitiator = String(trade.initiator?._id) === String(userId);
            const lastActive = trade.lastActivity ? new Date(trade.lastActivity).toLocaleString() : 'N/A';
            const statusMeta = getStatusStyle(trade.status);
            const mainItem = trade.item || (trade.receiverItems && trade.receiverItems[0]) || (trade.initiatorItems && trade.initiatorItems[0]);

            return (
              <div 
                key={trade._id} 
                onClick={() => onSelectTrade(trade._id)}
                style={{
                  padding: "1rem 1.2rem",
                  background: COLOR_CARD_BG,
                  borderRadius: "10px",
                  cursor: "pointer",
                  borderLeft: `5px solid ${statusMeta.color}`,
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#4A4B4B'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = COLOR_CARD_BG}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>
                    Trade with <span style={{ color: COLOR_ACCENT }}>{partner.username}</span>
                  </h3>
                  {mainItem && (
                    <p style={{ margin: '0.15rem 0', opacity: 0.8, fontSize: '0.85rem' }}>
                      Item: <span style={{ color: '#e5e7eb' }}>{mainItem.name || 'Barter item'}</span>
                    </p>
                  )}
                  <p style={{ margin: '0.15rem 0', opacity: 0.7, fontSize: '0.8rem' }}>
                    {isInitiator ? "You started this trade." : "Awaiting your response."}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: statusMeta.color, fontWeight: statusMeta.fontWeight }}>
                    {statusMeta.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                    Active: {lastActive}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
