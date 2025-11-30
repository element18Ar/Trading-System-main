import { useState } from "react";
import { refreshToken } from "../api/authApi.js";
import { Upload } from "lucide-react";

const COLOR_PRIMARY_DARK = "#2C2D2D";
const COLOR_ACCENT = "#00BFA5";
const COLOR_TEXT_LIGHT = "white";

const AddItemContent = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: "", description: "" });
  const [photo, setPhoto] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhotoChange = e => setPhoto(e.target.files[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    const seller = localStorage.getItem("userId");
    if (!photo) return alert("Please upload an image for your item.");
    if (!seller) return alert("User not logged in.");

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('itemImage', photo);
    formData.append('seller', seller);
    formData.append('price', 0);

    try {
      const token = localStorage.getItem("productServiceToken") || localStorage.getItem("authToken");
      let res = await fetch("http://localhost:5001/api/v1/products/items", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      // If token invalid, try to exchange and retry once
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        let auth = localStorage.getItem("authToken");
        // Try refresh to obtain a new access token
        try {
          const rt = await refreshToken();
          if (rt?.accessToken) {
            auth = rt.accessToken;
            localStorage.setItem("authToken", auth);
          }
        } catch {}
        if (auth) {
          try {
            const exRes = await fetch("http://localhost:5001/api/token/exchange", {
              method: "POST",
              headers: { Authorization: `Bearer ${auth}` },
            });
            if (exRes.ok) {
              const ex = await exRes.json();
              if (ex?.token) {
                localStorage.setItem("productServiceToken", ex.token);
                res = await fetch("http://localhost:5001/api/v1/products/items", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${ex.token}` },
                  body: formData
                });
              }
            }
          } catch {}
        }
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      await res.json();
      setFeedback("Your item was submitted and is now pending admin approval.");
      setForm({ name: "", description: "" });
      setPhoto(null);
      onSuccess();
    } catch (error) {
      console.error("Error listing item:", error);
      alert("Failed to list item. See console for details.");
    }
  };

  const inputStyle = { 
    padding: '0.8rem', 
    background: COLOR_PRIMARY_DARK, 
    border: `1px solid ${COLOR_ACCENT}`, 
    borderRadius: '6px', 
    color: COLOR_TEXT_LIGHT 
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>➕ List Item for Bartering</h2>
      {feedback && (
        <div style={{
          marginTop: "0.75rem",
          marginBottom: "0.5rem",
          padding: "0.6rem 0.9rem",
          borderRadius: "6px",
          backgroundColor: "#00BFA533",
          color: COLOR_TEXT_LIGHT,
          fontSize: "0.85rem",
        }}>
          {feedback}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input name="name" placeholder="Item Name" onChange={handleChange} value={form.name} required style={inputStyle} />
        <textarea name="description" placeholder="Description" rows={4} onChange={handleChange} value={form.description} required style={inputStyle} />
        <div style={{ ...inputStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: COLOR_ACCENT, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} /> Upload Item Photo
          </label>
          <input type="file" name="itemImage" onChange={handlePhotoChange} required accept="image/*" style={{ border: 'none', padding: '0.5rem', width: '100%', backgroundColor: COLOR_PRIMARY_DARK, cursor: 'pointer' }} />
          {photo && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Selected file: {photo.name}</p>}
        </div>
        <button type="submit" style={{ padding: "1rem", background: COLOR_ACCENT, border: "none", borderRadius: "8px", color: COLOR_PRIMARY_DARK, fontWeight: 700, cursor: "pointer" }}>Publish for Trade</button>
      </form>
    </div>
  );
};

export default AddItemContent;