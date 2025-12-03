import { useState, useEffect } from "react";
import { refreshToken as refreshAccessToken } from "../api/authApi.js";
import { Trash } from "lucide-react";

const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_ACCENT = "#00BFA5";
const COLOR_TEXT_LIGHT = "white";
const COLOR_DANGER = "#DC3545";

export default function UserProfileContent() {
  const userId = localStorage.getItem("userId");
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(storedUser?.avatar || null);
  const [avatarUploading, setAvatarUploading] = useState(false);

const initialUserDetails = {
  username: storedUser?.username || "Guest",
  email: storedUser?.email || "guest@example.com",
  joinDate: new Date().toLocaleDateString()
};


 // const initialUserDetails = {
  //username: "User-" + (userId ? userId.substring(0, 8) : "Guest"),
  //email: userId ? `user${userId.substring(0, 4)}@example.com` : "guest@example.com",
  //joinDate: new Date().toLocaleDateString()
//};

  const [userDetails, setUserDetails] = useState(initialUserDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(initialUserDetails.username);

  const handleSaveProfile = () => {
    setUserDetails(prev => ({ ...prev, username: newUsername }));
    setIsEditing(false);
    alert("Profile updated successfully! (Simulation)");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:5000/api/me/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data?.avatar) {
        setAvatar(data.avatar);
        const existing = JSON.parse(localStorage.getItem("user") || "null");
        if (existing) {
          localStorage.setItem("user", JSON.stringify({ ...existing, avatar: data.avatar }));
        }
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    if (!userId) return setLoading(false);

    const fetchUserItems = async () => {
      setLoading(true);
      try {
        const ensureToken = async () => {
          const existing = localStorage.getItem("productServiceToken");
          if (existing) return existing;
          let access = localStorage.getItem("authToken");
          if (!access) return null;
          // Try exchange with current access
          try {
            const exRes = await fetch("http://localhost:5001/api/token/exchange", {
              method: "POST",
              headers: { Authorization: `Bearer ${access}` },
            });
            if (exRes.ok) {
              const ex = await exRes.json();
              if (ex?.token) {
                localStorage.setItem("productServiceToken", ex.token);
                return ex.token;
              }
            }
          } catch {}
          // If exchange failed, refresh access token and try again
          try {
            const rt = await refreshAccessToken();
            if (rt?.accessToken) {
              access = rt.accessToken;
              localStorage.setItem("authToken", access);
              const exRes2 = await fetch("http://localhost:5001/api/token/exchange", {
                method: "POST",
                headers: { Authorization: `Bearer ${access}` },
              });
              if (exRes2.ok) {
                const ex2 = await exRes2.json();
                if (ex2?.token) {
                  localStorage.setItem("productServiceToken", ex2.token);
                  return ex2.token;
                }
              }
            }
          } catch {}
          return access;
        };

        let token = await ensureToken();
        let res = await fetch("http://localhost:5001/api/v1/products/items/mine", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.status === 403) {
          try { localStorage.removeItem("productServiceToken"); } catch {}
          token = await ensureToken();
          res = await fetch("http://localhost:5001/api/v1/products/items/mine", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const itemsArray = Array.isArray(data?.data?.items) ? data.data.items : (Array.isArray(data?.items) ? data.items : []);
        setItems(itemsArray || []);
      } catch (error) {
        console.error("Failed to fetch user items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [userId]);

  const editButtonStyle = { backgroundColor: COLOR_ACCENT, color: COLOR_PRIMARY_DARK, border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '1rem' };
  const cancelButtonStyle = { backgroundColor: COLOR_DANGER, color: COLOR_TEXT_LIGHT, border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '0.5rem' };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const ensureToken = async () => {
        const existing = localStorage.getItem("productServiceToken");
        if (existing) return existing;
        const access = localStorage.getItem("authToken");
        if (!access) return null;
        try {
          const exRes = await fetch("http://localhost:5001/api/token/exchange", {
            method: "POST",
            headers: { Authorization: `Bearer ${access}` },
          });
          if (exRes.ok) {
            const ex = await exRes.json();
            if (ex?.token) {
              localStorage.setItem("productServiceToken", ex.token);
              return ex.token;
            }
          }
        } catch {}
        return access;
      };

      let token = await ensureToken();
      let res = await fetch(`http://localhost:5001/api/v1/products/items/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) {
        try { localStorage.removeItem("productServiceToken"); } catch {}
        token = await ensureToken();
        res = await fetch(`http://localhost:5001/api/v1/products/items/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete item.');
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>👤 My Account & Listings</h2>
      <div style={{ background: COLOR_PRIMARY_DARK, padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#444',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: COLOR_TEXT_LIGHT,
            }}
          >
            {avatar ? (
              <img
                src={`http://localhost:5000/${avatar}`}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{userDetails.username?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
          </div>
          <label style={{ fontSize: '0.8rem', cursor: 'pointer', color: COLOR_ACCENT }}>
            {avatarUploading ? 'Uploading...' : 'Change photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{ flexGrow: 1 }}>
          <h3 style={{ color: COLOR_ACCENT, marginBottom: '1rem' }}>Account Information</h3>
        <p style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <strong>Username:</strong>
          {isEditing ? <>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.3rem', background: '#444', border: '1px solid #666', color: COLOR_TEXT_LIGHT, borderRadius: '4px' }} />
            <button style={{ ...editButtonStyle, backgroundColor: '#28A745' }} onClick={handleSaveProfile}>Save</button>
            <button style={cancelButtonStyle} onClick={() => { setIsEditing(false); setNewUsername(userDetails.username); }}>Cancel</button>
          </> : <>
            <span style={{ marginLeft: '0.5rem' }}>{userDetails.username}</span>
            <button style={editButtonStyle} onClick={() => setIsEditing(true)}>Edit</button>
          </>}
        </p>
        <p><strong>Email:</strong> {userDetails.email}</p>
        <p><strong>Member Since:</strong> {userDetails.joinDate}</p>
        </div>
      </div>

      <h3 style={{ color: COLOR_TEXT_LIGHT, borderBottom: `1px solid ${COLOR_ACCENT}50`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>My Items ({items.length})</h3>
      {loading && <p style={{ marginTop: '2rem' }}>Loading items...</p>}
      {!loading && items.length === 0 && <p style={{ marginTop: '2rem' }}>You haven't listed any items yet.</p>}
      {!loading && items.length > 0 && (
        <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {items.map(item => (
            <div key={item._id} style={{ padding: "1rem", background: COLOR_PRIMARY_DARK, borderRadius: "12px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)" }}>
              {item.image ? (
                <img
                  src={`http://localhost:5001/${String(item.image).replace(/\\\\/g, '/').replace(/^\//, '')}`}
                  alt={item.name}
                  style={{ height: '140px', width: '100%', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }}
                />
              ) : (
                <div style={{ height: '140px', backgroundColor: '#444', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.85rem' }}>
                  No photo
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ color: COLOR_ACCENT, margin: 0 }}>{item.name}</h4>
                <button
                  title="Delete"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '8px', border: 'none', backgroundColor: COLOR_DANGER, color: COLOR_TEXT_LIGHT, cursor: 'pointer' }}
                  onClick={() => handleDeleteItem(item._id)}
                >
                  <Trash size={16} />
                </button>
              </div>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{item.description?.substring(0, 50)}...</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor:
                      item.status === 'pending'
                        ? '#FFC10733'
                        : item.status === 'rejected'
                        ? '#DC354533'
                        : '#00BFA533',
                    color:
                      item.status === 'pending'
                        ? '#FFC107'
                        : item.status === 'rejected'
                        ? '#DC3545'
                        : COLOR_ACCENT,
                    fontWeight: 600,
                  }}
                >
                  {item.status === 'pending'
                    ? 'Pending approval'
                    : item.status === 'rejected'
                    ? 'Rejected'
                    : 'Approved'}
                </span>
                {item.status === 'rejected' && item.reviewNote && (
                  <p style={{ marginTop: '0.3rem', opacity: 0.8 }}>Reason: {item.reviewNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
