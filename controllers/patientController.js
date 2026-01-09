const { db } = require("../config/firebase");

// --- UPDATE PATIENT PROFILE ---
exports.updatePatientProfile = async (req, res) => {
  try {
    const { uid, name, phone, address, photoUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (photoUrl) updateData.photoUrl = photoUrl;

    await db.collection("patients").doc(uid).update(updateData);

    res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};
