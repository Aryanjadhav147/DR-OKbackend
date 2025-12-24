const express = require('express');
const cors = require('cors');
// IMPORT CONNECTION FROM YOUR NEW FILE
const { db, admin } = require('./firebase'); 

const app = express();

app.use(cors());
app.use(express.json());

// --- API 1: REGISTER PATIENT ---
app.post('/api/register-patient', async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;

    await db.collection('patients').doc(uid).set({
      uid,
      email,
      name,
      phone,
      role: 'patient',
      createdAt: new Date()
    });

    res.status(200).json({ message: "Patient Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API 2: REGISTER DOCTOR ---
app.post('/api/register-doctor', async (req, res) => {
  try {
    const { uid, email, name, phone, specialization, experience, license, hospital } = req.body;

    await db.collection('doctors').doc(uid).set({
      uid,
      email,
      name,
      phone,
      specialization,
      experience,
      licenseNumber: license,
      hospitalName: hospital,
      role: 'doctor',
      isVerified: false, 
      createdAt: new Date()
    });

    res.status(200).json({ message: "Doctor Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API 3: CHECK USER ROLE ---
app.get('/api/get-role/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;

    const doctorDoc = await db.collection('doctors').doc(uid).get();
    if (doctorDoc.exists) {
      return res.json({ role: 'doctor' });
    }

    const patientDoc = await db.collection('patients').doc(uid).get();
    if (patientDoc.exists) {
      return res.json({ role: 'patient' });
    }

    return res.status(404).json({ error: "User not found in database" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- VERCEL CONFIGURATION ---
// 1. Use process.env.PORT for cloud hosting (Render/Vercel)
const PORT = process.env.PORT || 5000;

// 2. Wrap the listener so Vercel doesn't crash
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// 3. Export for Vercel
module.exports = app;