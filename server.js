// server/server.js
const express = require('express');
const cors = require('cors');

const app = express();

// --- 1. SECURE CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",       // Vite Localhost (Alternate)
  "http://localhost:5000",       // Backend Localhost
  "https://dr-ok.netlify.app", 
  "https://dr-o-kfrontend.vercel.app"   // YOUR LIVE NETLIFY FRONTEND
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labRoutes = require("./routes/labRoutes")
const patientRoutes = require('./routes/patientRoutes');

// Use Routes
// Note: We add '/api' here so we don't need to write it in every route file
app.use('/api', authRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', doctorRoutes);
// This tells the server: "If any link starts with /api, check the prescription routes too"
app.use('/api', prescriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/patients', patientRoutes);

// Vercel / Port Config
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;