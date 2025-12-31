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

// --- 2. BOOK A LAB TEST (Saves the booking) ---
exports.bookLabTest = async (req, res) => {
  try {
    const { patientId, patientName, labId, labName, testName, price, date, timeSlot } = req.body;

    if (!patientId || !labId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

    const bookingData = {
      patientId,
      patientName, // Useful for the Lab Technician's Dashboard later
      labId,
      labName,
      testName,
      price,
      date,
      timeSlot,
      status: 'Upcoming', // Default status
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('lab_bookings').add(bookingData);

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
//  4. GET LAB'S OWN BOOKINGS (For Lab Dashboard) ---
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

// --- 5. UPDATE BOOKING (Upload Report) ---
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status, reportUrl } = req.body;
    await db.collection('lab_bookings').doc(bookingId).update({
      status,
      reportUrl: reportUrl || null
    });
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