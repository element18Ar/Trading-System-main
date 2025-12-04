import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

import connectDB from "../config/db.js";
import DotenvFlow from "dotenv-flow";
import path from "path";
import { fileURLToPath } from "url";

import messageRoutes from "./routes/messageRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import adminTradeRoutes from "./routes/adminTradeRoutes.js";

{
  const callerFile = fileURLToPath(import.meta.url);
  const serviceDir = path.dirname(callerFile);
  const projectRoot = path.resolve(serviceDir, "../../");
  DotenvFlow.config({ path: projectRoot, silent: true });
  DotenvFlow.config({ path: serviceDir, silent: true, override: true });
}

const app = express();

app.use(express.json());
const corsOptions = {
  origin: (origin, cb) => cb(null, origin || true),
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

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
