// server/server.js
const express = require("express");
const cors = require("cors");

const app = express();

// --- 1. SECURE CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:5000",
  "https://dr-ok.netlify.app",
  "https://dr-o-kfrontend.vercel.app",
];

// Reusable CORS middleware configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS to all requests
app.use(cors(corsOptions));

// FIX: Handle Preflight requests specifically for Vercel/Express Regex
// Instead of '*', we use '/(.*)' to satisfy the path-to-regexp requirement
app.options("/(.*)", cors(corsOptions));

// --- 2. MIDDLEWARE ---
app.use(express.json());

// --- 3. IMPORT ROUTES ---
const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const labRoutes = require("./routes/labRoutes");
const patientRoutes = require("./routes/patientRoutes");

// --- 4. USE ROUTES ---
app.use("/api", authRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", doctorRoutes);
app.use("/api", prescriptionRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/patients", patientRoutes);

// --- 5. VERCEL / PORT CONFIG ---
const PORT = process.env.PORT || 5000;

// This allows the app to run locally but also work as a Vercel serverless function
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
