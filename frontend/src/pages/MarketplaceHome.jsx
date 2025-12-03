import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTrade } from "../api/tradeApi.js";

const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_ACCENT = "#00BFA5";
const COLOR_TEXT_LIGHT = "white";

export default function MarketplaceHome({ canTrade = true }) {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSellerId, setHoveredSellerId] = useState(null);
  const [sellerProfiles, setSellerProfiles] = useState({});
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5001/api/v1/products/items");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data?.data?.items) ? data.data.items : (Array.isArray(data?.items) ? data.items : []);
        setAllItems(items);
      } catch (error) {
        console.error("Failed to fetch marketplace items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchAllSellers = async () => {
      try {
        const ids = Array.from(new Set(
          allItems.map(i => (i && typeof i.seller === 'object' ? i.seller._id : i.seller)).filter(Boolean)
        ));
        const token = localStorage.getItem("authToken");
        const missing = ids.filter(id => !sellerProfiles[id]);
        await Promise.all(missing.map(async (id) => {
          try {
            const r = await fetch(`http://localhost:5000/api/users/${id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!r.ok) return;
            const u = await r.json();
            setSellerProfiles(prev => ({ ...prev, [id]: u }));
          } catch (e) {
            console.error(e);
          }
        }));
      } catch (e) {
        console.error(e);
      }
    };
    if (allItems.length > 0) fetchAllSellers();
  }, [allItems]);

  useEffect(() => {
    const fetchSeller = async (sellerId) => {
      if (!sellerId || sellerProfiles[sellerId]) return;
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`http://localhost:5000/api/users/${sellerId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setSellerProfiles(prev => ({ ...prev, [sellerId]: data }));
      } catch {}
    };

    if (hoveredSellerId) {
      fetchSeller(hoveredSellerId);
    }
  }, [hoveredSellerId, sellerProfiles]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ color: COLOR_ACCENT }}>🏠 Barter Marketplace</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>Browse all items currently available for trade.</p>

      {loading && <p>Loading marketplace...</p>}
      {!loading && allItems.length === 0 && <p>No items have been listed yet. Be the first to start trading!</p>}

      {!loading && allItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {allItems.map(item => (
            <div key={item._id} style={{ padding: "1rem", background: COLOR_PRIMARY_DARK, borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.3)", border: `1px solid ${COLOR_ACCENT}50` }}>
              {item.image ? (
                <img
                  src={`http://localhost:5001/${String(item.image).replace(/\\\\/g, '/').replace(/^\//, '')}`}
                  alt={item.name}
                  style={{ height: '150px', width: '100%', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                />
              ) : (
                <div style={{ height: '150px', backgroundColor: '#444', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.9rem' }}>
                  No photo
                </div>
              )}
              <h3 style={{ color: COLOR_TEXT_LIGHT, marginBottom: '0.5rem' }}>{item.name}</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem', minHeight: '40px' }}>{item.description?.substring(0, 100)}...</p>
              <p style={{ fontWeight: 600, marginTop: '1rem', color: COLOR_ACCENT }}>Barter Item</p>
              {(() => {
                const sellerObj = item && typeof item.seller === 'object' ? item.seller : null;
                const sellerId = sellerObj ? sellerObj._id : item.seller;
                const sellerName = sellerObj?.username || sellerProfiles[sellerId]?.username;
                return (
                  <p
                    style={{ fontSize: '0.8rem', opacity: 0.7, cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredSellerId(sellerId)}
                    onMouseLeave={() => setHoveredSellerId((prev) => (prev === sellerId ? null : prev))}
                  >
                    Seller: {sellerName || `${String(sellerId || '').substring(0, 8)}...`}
                  </p>
                );
              })()}

              {(() => {
                const sellerObj = item && typeof item.seller === 'object' ? item.seller : null;
                const sellerId = sellerObj ? sellerObj._id : item.seller;
                return canTrade && String(sellerId) !== String(currentUserId);
              })() && (
                <button
                  style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: '8px', border: 'none', background: COLOR_ACCENT, color: COLOR_PRIMARY_DARK, fontWeight: 700, cursor: 'pointer' }}
                  onClick={async () => {
                    const initiatorId = localStorage.getItem("userId");
                    if (!initiatorId) {
                      alert('Please log in first to start a negotiation.');
                      navigate('/login');
                      return;
                    }
                    try {
                      const sellerObj = item && typeof item.seller === 'object' ? item.seller : null;
                      const sellerId = sellerObj ? sellerObj._id : item.seller;
                      const res = await createTrade({
                        initiatorId,
                        receiverId: sellerId,
                        receiverItemId: item._id,
                        itemId: item._id,
                      });
                      const trade = res.data;
                      if (trade && trade._id) {
                        localStorage.setItem('activeTradeId', trade._id);
                        navigate(`/dashboard/${initiatorId}?view=Inbox&trade=${trade._id}`);
                      }
                    } catch (e) {
                      console.error('Failed to start chat for item:', e);
                      alert('Failed to start negotiation. Please try again in a moment.');
                    }
                  }}
                >Discuss / Chat</button>
              )}
            </div>
          ))}
        </div>
      )}

      {hoveredSellerId && sellerProfiles[hoveredSellerId] && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: COLOR_PRIMARY_DARK,
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
            zIndex: 1400,
            minWidth: '260px',
          }}
          onMouseLeave={() => setHoveredSellerId(null)}
        >
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: COLOR_ACCENT }}>Seller Profile</h4>
          <p style={{ margin: 0, marginBottom: '0.25rem', fontWeight: 600 }}>
            {sellerProfiles[hoveredSellerId].username}
          </p>
          <p style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
            {sellerProfiles[hoveredSellerId].email}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
            Member since: {sellerProfiles[hoveredSellerId].createdAt ? new Date(sellerProfiles[hoveredSellerId].createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      )}
    </div>
  );
}
