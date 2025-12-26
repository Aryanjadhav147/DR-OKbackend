// server/server.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

// Use Routes
// Note: We add '/api' here so we don't need to write it in every route file
app.use('/api', authRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', doctorRoutes);

// Vercel / Port Config
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;