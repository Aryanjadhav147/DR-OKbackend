// REASON: Imports for creating the server and handling requests
const express = require('express');
const cors = require('cors');
// REASON: We use firebase-admin to have full access to the database (User permissions don't apply here)
const admin = require('firebase-admin'); 
const serviceAccount = require('./serviceAccountKey.json'); // You download this from Firebase Console

// Initialize the Admin SDK to talk to Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors()); // REASON: Allows your React app (port 3000) to talk to this server (port 5000)
app.use(express.json()); // REASON: Allows the server to understand JSON data sent from React forms

// --- API 1: REGISTER PATIENT ---
// REASON: Saves basic user data to the 'patients' collection
app.post('/api/register-patient', async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;

    // We use .doc(uid).set() so the document ID is the same as the Auth ID. 
    // This makes finding the user easier later.
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
// REASON: Saves complex doctor data. Distinct endpoint so we can add specific validation later.
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
      isVerified: false, // Default to false until an admin checks their license
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

    // 1. Check if they exist in the 'doctors' collection
    const doctorDoc = await db.collection('doctors').doc(uid).get();
    if (doctorDoc.exists) {
      return res.json({ role: 'doctor' });
    }

    // 2. Check if they exist in the 'patients' collection
    const patientDoc = await db.collection('patients').doc(uid).get();
    if (patientDoc.exists) {
      return res.json({ role: 'patient' });
    }

    return res.status(404).json({ error: "User not found in database" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));