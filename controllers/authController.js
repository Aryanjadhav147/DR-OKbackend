const { db } = require('../config/firebase');

// --- 1. REGISTER PATIENT ---
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

// --- 2. REGISTER DOCTOR ---
exports.registerDoctor = async (req, res) => {
  try {
    const { uid, email, name, phone, specialization, experience, license, hospital } = req.body;
    await db.collection('doctors').doc(uid).set({
      uid, email, name, phone, specialization, experience,
      licenseNumber: license, hospitalName: hospital, role: 'doctor',
      isVerified: false, // Default false until Agent approves
      createdAt: new Date()
    });
    res.status(200).json({ message: "Doctor Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. REGISTER LAB ---
exports.registerLab = async (req, res) => {
  try {
    const { uid, email, name, phone, address, location } = req.body;
    
    await db.collection('labs').doc(uid).set({
      uid, 
      email, 
      name, 
      phone, 
      address, 
      location, 
      role: 'lab',
      isVerified: false, // Default false until Agent approves
      timings: "09:00 AM - 09:00 PM",
      services: [],
      createdAt: new Date()
    });

    res.status(200).json({ message: "Lab Profile Created. Pending Verification." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. GET USER ROLE (Fixed) ---
exports.getRole = async (req, res) => {
  try {
    const uid = req.params.uid;
    // console.log("🔍 Checking Role for UID:", uid);

    // A. Check Doctors
    const doctorDoc = await db.collection('doctors').doc(uid).get();
    if (doctorDoc.exists) {
        const data = doctorDoc.data();
        if (data.isVerified === false) return res.json({ role: 'pending', name: data.name });
        return res.json({ role: 'doctor', name: data.name });
    }

    // B. Check Labs
    const labDoc = await db.collection('labs').doc(uid).get();
    if (labDoc.exists) {
        const data = labDoc.data();
        if (data.isVerified === false) return res.json({ role: 'pending', name: data.name });
        return res.json({ role: 'lab', name: data.name });
    }

    // C. Check Patients
    const patientDoc = await db.collection('patients').doc(uid).get();
    if (patientDoc.exists) {
      return res.json({ role: 'patient', name: patientDoc.data().name });
    }

    // If no match found
    console.log("❌ User not found in any collection");
    return res.status(404).json({ error: "User not found" });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 5. VERIFY DOCTOR (Agent Only) ---
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

// --- 6. VERIFY LAB (Agent Only) ---
exports.verifyLab = async (req, res) => {
  try {
    const { labId } = req.body;
    await db.collection('labs').doc(labId).update({
      isVerified: false
    });
    res.status(200).json({ message: "Lab Verified Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 7. REQUEST AGENT ---
exports.requestAgent = async (req, res) => {
  try {
    const { name, phone, type } = req.body; 
    await db.collection('agent_requests').add({
      name, phone, type: type || 'unknown', status: 'pending', createdAt: new Date()
    });
    res.status(200).json({ message: "Agent will call you shortly." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};