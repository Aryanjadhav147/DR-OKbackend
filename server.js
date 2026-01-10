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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// 2. THE FIX: Place this at the VERY TOP
// This single line handles both normal requests AND preflight (OPTIONS) requests automatically.
app.use(cors(corsOptions));

// --- 3. MIDDLEWARE ---
app.use(express.json());

// --- 4. IMPORT ROUTES ---
const authRoutes = require("./routes/authRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const labRoutes = require("./routes/labRoutes");
const patientRoutes = require("./routes/patientRoutes");

// --- 5. USE ROUTES ---
app.use("/api", authRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", doctorRoutes);
app.use("/api", prescriptionRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/patients", patientRoutes);

// --- 6. VERCEL / PORT CONFIG ---
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
