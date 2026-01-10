const { db } = require("../config/firebase");

// --- 1. REGISTER PATIENT ---
exports.registerPatient = async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;
    await db.collection("patients").doc(uid).set({
      uid,
      email,
      name,
      phone,
      role: "patient",
      createdAt: new Date(),
    });
    res.status(200).json({ message: "Patient Profile Created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 2. REGISTER DOCTOR ---
exports.registerDoctor = async (req, res) => {
  try {
    const {
      uid,
      email,
      name,
      phone,
      specialization,
      experience,
      license,
      hospital,
    } = req.body;
    await db.collection("doctors").doc(uid).set({
      uid,
      email,
      name,
      phone,
      specialization,
      experience,
      licenseNumber: license,
      hospitalName: hospital,
      role: "doctor",
      isVerified: false,
      createdAt: new Date(),
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

    const defaultSchedule = {
      monday: { isOpen: true, open: "09:00", close: "21:00" },
      tuesday: { isOpen: true, open: "09:00", close: "21:00" },
      wednesday: { isOpen: true, open: "09:00", close: "21:00" },
      thursday: { isOpen: true, open: "09:00", close: "21:00" },
      friday: { isOpen: true, open: "09:00", close: "21:00" },
      saturday: { isOpen: true, open: "09:00", close: "21:00" },
      sunday: { isOpen: false, open: "10:00", close: "14:00" },
    };

    await db.collection("labs").doc(uid).set({
      uid,
      email,
      name,
      phone,
      address,
      location,
      role: "lab",
      isVerified: false,
      timings: "09:00 AM - 09:00 PM",
      schedule: defaultSchedule,
      services: [],
      createdAt: new Date(),
    });

    res
      .status(200)
      .json({ message: "Lab Profile Created. Pending Verification." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. GET USER ROLE ---
exports.getRole = async (req, res) => {
  try {
    const { uid } = req.params;

    // Check Doctors
    const doctorDoc = await db.collection("doctors").doc(uid).get();
    if (doctorDoc.exists) {
      const data = doctorDoc.data();
      return res.json({
        role: data.isVerified ? "doctor" : "pending",
        name: data.name,
      });
    }

    // Check Labs
    const labDoc = await db.collection("labs").doc(uid).get();
    if (labDoc.exists) {
      const data = labDoc.data();
      return res.json({
        role: data.isVerified ? "lab" : "pending",
        name: data.name,
      });
    }

    // Check Patients
    const patientDoc = await db.collection("patients").doc(uid).get();
    if (patientDoc.exists) {
      return res.json({ role: "patient", name: patientDoc.data().name });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. VERIFY DOCTOR ---
exports.verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    await db.collection("doctors").doc(doctorId).update({ isVerified: true });
    res.status(200).json({ message: "Doctor Verified Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. VERIFY LAB ---
exports.verifyLab = async (req, res) => {
  try {
    const { labId } = req.body;
    // FIX: Changed from false to true
    await db.collection("labs").doc(labId).update({ isVerified: true });
    res.status(200).json({ message: "Lab Verified Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 7. REQUEST AGENT ---
exports.requestAgent = async (req, res) => {
  try {
    const { name, phone, type } = req.body;
    await db.collection("agent_requests").add({
      name,
      phone,
      type: type || "unknown",
      status: "pending",
      createdAt: new Date(),
    });
    res.status(200).json({ message: "Agent will call you shortly." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
