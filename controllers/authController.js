const { db } = require('../config/firebase');

exports.registerPatient = async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;
    await db.collection('patients').doc(uid).set({
      uid, email, name, phone, role: 'patient', createdAt: new Date()
    });
    res.status(200).json({ message: "Patient Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerDoctor = async (req, res) => {
  try {
    const { uid, email, name, phone, specialization, experience, license, hospital } = req.body;
    await db.collection('doctors').doc(uid).set({
      uid, email, name, phone, specialization, experience,
      licenseNumber: license, hospitalName: hospital, role: 'doctor',
      isVerified: false, createdAt: new Date()
    });
    res.status(200).json({ message: "Doctor Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. UPDATE getRole (To check verification status)
exports.getRole = async (req, res) => {
  try {
    const uid = req.params.uid;

    // Check Doctors
    const doctorDoc = await db.collection('doctors').doc(uid).get();
    if (doctorDoc.exists) {
      const data = doctorDoc.data();
      // NEW: Check if they are verified
      if (data.role === 'doctor' && data.isVerified === false) {
        return res.json({ role: 'pending', name: data.name }); // Send 'pending' role
      }
      return res.json({ role: 'doctor', name: data.name });
    }

    // Check Patients (No verification needed)
    const patientDoc = await db.collection('patients').doc(uid).get();
    if (patientDoc.exists) {
      return res.json({ role: 'patient', name: patientDoc.data().name });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. NEW: Request Agent Callback (For busy doctors)
exports.requestAgent = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await db.collection('agent_requests').add({
      name,
      phone,
      status: 'pending',
      createdAt: new Date()
    });
    res.status(200).json({ message: "Agent will call you shortly." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. NEW: Verify Doctor (Agent uses this)
exports.verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    await db.collection('doctors').doc(doctorId).update({
      isVerified: true
    });
    res.status(200).json({ message: "Doctor Verified Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- NEW: Request Agent Callback ---
exports.requestAgent = async (req, res) => {
  try {
    const { name, phone } = req.body;
    // Save to a new collection 'agent_requests'
    await db.collection('agent_requests').add({
      name,
      phone,
      status: 'pending',
      createdAt: new Date()
    });
    res.status(200).json({ message: "Request received. Agent will call shortly." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- NEW: Verify Doctor (Agent uses this) ---
exports.verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    // Update the doctor's profile to be verified
    await db.collection('doctors').doc(doctorId).update({
      isVerified: true
    });
    res.status(200).json({ message: "Doctor Verified Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};