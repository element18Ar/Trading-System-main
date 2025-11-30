import express from "express";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import itemRoutes from "./routes/itemRoutes.js";
import adminItemRoutes from "./routes/adminItemRoutes.js";
import Item from "./models/Item.js";
import { loadEnv } from "../config/loadEnv.js";
loadEnv(import.meta.url);

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5175",
  ],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/products/items", itemRoutes);
app.use("/api/admin/items", adminItemRoutes);

app.get("/", (req, res) => {
  res.send("Product Service is operational.");
});

app.post("/api/token/exchange", (req, res) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'dev_secret_key';
    const serviceSecret = process.env.JWT_SECRET || 'dev_secret_key';
    let decoded;
    try { decoded = jwt.verify(token, accessSecret); } catch {}
    if (!decoded) {
      try { decoded = jwt.verify(token, serviceSecret); } catch {}
    }
    if (!decoded) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    if (decoded?.iss !== 'auth-service') {
      return res.status(403).json({ message: 'Invalid token issuer' });
    }
    const serviceToken = jwt.sign(
      {
        sub: String(decoded.id),
        id: String(decoded.id),
        role: decoded.role,
        iss: 'auth-service',
        aud: ['product-service']
      },
      serviceSecret,
      { expiresIn: "2h" }
    );
    return res.json({ token: serviceToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

const PORT = process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 5001;

connectDB(mongoose)
  .then(async () => {
    // Ensure existing items without status are treated as approved
    try {
      await Item.updateMany({ status: { $exists: false } }, { $set: { status: "approved" } });
    } catch (e) {
      console.error("Failed to normalize item status:", e.message);
    }
    app.listen(PORT, () => {
      console.log(`Product Service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB for product-service:", err);
    process.exit(1);
  });
