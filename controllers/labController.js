const { db } = require('../config/firebase');

// --- 1. GET ALL LABS (For the Booking Page) ---
exports.getAllLabs = async (req, res) => {
  try {
    const snapshot = await db.collection('labs').get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const labs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(labs);
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
};

// --- 2. BOOK A LAB TEST (UPDATED for Home Collection) ---
exports.bookLabTest = async (req, res) => {
  try {
    // 1. Extract all data including new fields
    const { 
      patientId, patientName, labId, labName, testName, price, date, timeSlot,
      collectionType,    // <--- NEW
      collectionAddress, // <--- NEW
      status             // <--- NEW
    } = req.body;

    if (!patientId || !labId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

    // 2. Create the data object
    const bookingData = {
      patientId,
      patientName,
      labId,
      labName,
      testName,
      price,
      date,
      timeSlot,
      
      // --- NEW FIELDS LOGIC ---
      collectionType: collectionType || 'lab', 
      collectionAddress: collectionAddress || "Patient will visit Lab",
      status: status || 'pending', // Default to 'pending' so Lab can confirm it
      
      reportUrl: null,
      createdAt: new Date().toISOString()
    };

    // 3. Save to Firestore
    // Using .add() automatically generates an ID
    const docRef = await db.collection('lab_bookings').add(bookingData);

    // Optional: Update the document to include its own ID (makes fetching easier later)
    await docRef.update({ id: docRef.id });

    res.status(201).json({ 
      message: "Lab test booked successfully!", 
      bookingId: docRef.id 
    });

  } catch (error) {
    console.error("Error booking lab test:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

// --- 3. GET PATIENT'S BOOKINGS (For Patient Dashboard) ---
exports.getPatientBookings = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    const snapshot = await db.collection('lab_bookings')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc') 
      .get();

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(bookings);

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// --- 4. GET LAB'S OWN BOOKINGS (For Lab Dashboard) ---
exports.getLabBookings = async (req, res) => {
  try {
    const { labId } = req.params;
    const snapshot = await db.collection('lab_bookings')
      .where('labId', '==', labId)
      // .orderBy('date', 'desc') // Add index in Firebase if this errors
      .get();
    
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. UPDATE BOOKING (Upload Report / Confirm Booking) ---
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status, reportUrl } = req.body;
    
    // Create update object dynamically
    const updateData = { status };
    if (reportUrl) updateData.reportUrl = reportUrl;

    await db.collection('lab_bookings').doc(bookingId).update(updateData);
    
    res.json({ message: "Booking updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. MANAGE SERVICES (Add/Remove Tests) ---
exports.updateLabServices = async (req, res) => {
  try {
    const { labId, services } = req.body; // services is an array of objects
    await db.collection('labs').doc(labId).update({ services });
    res.json({ message: "Services updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 7. UPDATE LAB SETTINGS (Schedule & Info) ---
exports.updateLabSettings = async (req, res) => {
  try {
    const { labId, schedule, holidayDate } = req.body;
    
    const updateData = {};
    if (schedule) updateData.schedule = schedule;
    
    // Future: Handle holiday logic here if needed

    await db.collection('labs').doc(labId).update(updateData);
    res.json({ message: "Lab settings updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// --- 8. UPDATE LAB PROFILE (Photo, Name, Address) ---
exports.updateLabProfile = async (req, res) => {
  try {
    const { labId, name, phone, address, photoUrl } = req.body;
    
    // Construct update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (photoUrl) updateData.photoUrl = photoUrl; // Only save if a new photo exists

    await db.collection('labs').doc(labId).update(updateData);
    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};