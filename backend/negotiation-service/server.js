import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

import connectDB from "../config/db.js";
import { loadEnv } from "../config/loadEnv.js";

import messageRoutes from "./routes/messageRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import adminTradeRoutes from "./routes/adminTradeRoutes.js";

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

app.get("/", (req, res) => res.send("Negotiation Service is operational."));

app.use("/api/messages", messageRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/admin/trades", adminTradeRoutes);

app.post("/api/token/exchange", (req, res) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
    const serviceToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    return res.json({ token: serviceToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});

const PORT = process.env.NEGOTIATION_SERVICE_PORT || process.env.PORT || 5002;

connectDB(mongoose)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Negotiation Service running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB for negotiation-service:", err);
    process.exit(1);
  });
