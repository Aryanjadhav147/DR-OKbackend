const { db } = require("../config/firebase"); // Keep your existing path

// --- HELPER: Haversine Formula to calculate distance in KM ---
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// --- 1. GET ALL DOCTORS (Smart Search with Location & Filters) ---
// --- 1. GET ALL DOCTORS (Robust Search) ---
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, city, lat, lng } = req.query;

    // 1. Fetch ALL doctors first (Simplifies filtering logic)
    const snapshot = await db.collection('doctors').get();
    let doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // --- DEBUGGING LOG (Check your terminal to see what's happening) ---
    console.log(`🔍 Search Request -> Spec: "${specialization}", City: "${city}"`);
    console.log(`📊 Total Doctors Found: ${doctors.length}`);

    // 2. Filter by Specialization (Case-Insensitive)
    if (specialization && specialization !== 'All') {
      doctors = doctors.filter(doc => 
        doc.specialization && 
        doc.specialization.toLowerCase().trim() === specialization.toLowerCase().trim()
      );
    }

    // 3. Filter by City (Text Search - Only if no GPS provided)
    if (city && !lat) {
      const searchCity = city.toLowerCase().trim();
      doctors = doctors.filter(doc => 
        (doc.address && doc.address.toLowerCase().includes(searchCity)) ||
        (doc.hospitalName && doc.hospitalName.toLowerCase().includes(searchCity))
      );
    }

    // 4. Sort by Distance (GPS Search)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      doctors = doctors.map(doc => {
        // If doctor has no location, push to bottom
        if (!doc.location || !doc.location.lat) {
            return { ...doc, distance: 9999 };
        }
        
        const dist = getDistanceFromLatLonInKm(
            userLat, userLng, 
            doc.location.lat, doc.location.lng
        );
        return { ...doc, distance: dist };
      });

      // Sort: Closest first
      doctors.sort((a, b) => a.distance - b.distance);
    }

    console.log(`✅ Returning ${doctors.length} doctors after filter.`);
    res.status(200).json(doctors);

  } catch (error) {
    console.error("Error searching doctors:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- 2. GET DOCTOR HISTORY (Unchanged) ---
exports.getDoctorHistory = async (req, res) => {
  try {
    const { uid } = req.params;
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
    res.status(200).json([]); 
  }
};

// --- 3. UPDATE DOCTOR PROFILE (Unchanged) ---
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
