import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";//wala nakita dae..

import connectDB from "../config/db.js"; 
import { loadEnv } from "../config/loadEnv.js";

import authRoutes from './routes/authRoutes.js'; 
import userRoutes from './routes/userRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';

// Load environment variables
loadEnv(import.meta.url);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
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

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Auth Server and MongoDB are working!");
});

// Connect to MongoDB first
connectDB(mongoose)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
