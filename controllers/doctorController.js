const { db } = require("../config/firebase"); // Adjust path to your firebase config if needed

// --- 1. GET ALL DOCTORS (Matches route: /all-doctors) ---
exports.getAllDoctors = async (req, res) => {
  try {
    const doctorsSnapshot = await db.collection('doctors').get();
    const doctors = doctorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. GET DOCTOR HISTORY (Matches route: /doctor-history/:uid) ---
exports.getDoctorHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    // Assuming you store prescriptions in a collection called 'prescriptions'
    // or inside the doctor document. Adjust based on your DB structure.
    const historySnapshot = await db.collection('prescriptions')
      .where('doctorId', '==', uid)
      .orderBy('date', 'desc')
      .get();

    const history = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    // Return empty array instead of crashing if collection doesn't exist yet
    res.status(200).json([]); 
  }
};

// --- 3. UPDATE DOCTOR PROFILE (Matches route: /update-profile) ---
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { uid, name, phone, address, photoUrl } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (photoUrl) updateData.photoUrl = photoUrl;

    await db.collection('doctors').doc(uid).update(updateData);
    
    res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};