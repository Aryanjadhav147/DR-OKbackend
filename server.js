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

// --- API 3: CHECK USER ROLE & NAME ---
app.get('/api/get-role/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;

    // 1. Check Doctors
    const doctorDoc = await db.collection('doctors').doc(uid).get();
    if (doctorDoc.exists) {
      // Return Role AND Name
      return res.json({ role: 'doctor', name: doctorDoc.data().name });
    }

    // 2. Check Patients
    const patientDoc = await db.collection('patients').doc(uid).get();
    if (patientDoc.exists) {
      // Return Role AND Name
      return res.json({ role: 'patient', name: patientDoc.data().name });
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- API 4: CREATE SCHEDULE (The Slot Calculator) ---
app.post('/api/create-schedule', async (req, res) => {
  try {
    const { uid, date, startTime, endTime, duration, hospital } = req.body;

    const slotsBatch = db.batch();
    const slotsRef = db.collection('slots');

    // 1. Check existing slots
    const existingSnapshot = await slotsRef
      .where('doctorId', '==', uid)
      .where('date', '==', date)
      .get();

    const existingTimes = new Set(existingSnapshot.docs.map(doc => doc.data().time));

    const toMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    let currentMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    const sessionDuration = parseInt(duration);

    let createdCount = 0;
    let skippedCount = 0;

    // 2. Loop to generate slots
    while (currentMinutes + sessionDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const m = (currentMinutes % 60).toString().padStart(2, '0');
      const timeString = `${h}:${m}`;

      if (existingTimes.has(timeString)) {
        skippedCount++;
      } else {
        const newSlotRef = slotsRef.doc();
        slotsBatch.set(newSlotRef, {
          doctorId: uid,
          hospitalName: hospital,
          date: date,
          time: timeString,
          isBooked: false,
          patientId: null,
          patientName: null,
          createdAt: new Date()
        });
        createdCount++;
      }
      currentMinutes += sessionDuration;
    }

    // --- NEW LOGIC: DECIDE RESPONSE ---

    if (createdCount > 0) {
      // Scenario A: We created at least one new slot. Success!
      await slotsBatch.commit();
      return res.status(200).json({ 
        message: `Success! Created ${createdCount} new slots.` 
      });
    } 
    else if (skippedCount > 0) {
      // Scenario B: We didn't create anything because they ALL exist.
      // Send 400 Error so the Frontend catches it and alerts the user.
      return res.status(400).json({ 
        error: "Slots are already created for this time range!" 
      });
    } 
    else {
      // Scenario C: Invalid time range (e.g. Start 10am, End 9am)
      return res.status(400).json({ 
        error: "Invalid time range. No slots created." 
      });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- API 5: GET DOCTOR'S OWN SCHEDULE (See all slots) ---
app.get('/api/doctor-slots/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.doctorId;

    const snapshot = await db.collection('slots')
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .get();

    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by time so it looks like a real schedule (09:00 -> 10:00)
    slots.sort((a, b) => a.time.localeCompare(b.time));

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- API 6: FIND DOCTORS (Search & Filter) ---
app.get('/api/find-doctors', async (req, res) => {
  try {
    const { specialization, city } = req.query;

    // 1. Base Query: Get ALL Verified doctors of that specialization
    let query = db.collection('doctors')
      .where('role', '==', 'doctor')
      .where('isVerified', '==', true); // Only show verified doctors

    if (specialization && specialization !== 'All') {
      query = query.where('specialization', '==', specialization);
    }

    const snapshot = await query.get();
    let doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Location Filter (Client-Side filtering for partial match)
    // Firestore doesn't support "contains" queries natively, so we filter the results here.
    if (city) {
      const searchKey = city.toLowerCase();
      doctors = doctors.filter(doc => 
        (doc.hospitalName && doc.hospitalName.toLowerCase().includes(searchKey)) ||
        (doc.name && doc.name.toLowerCase().includes(searchKey))
      );
    }

    res.json(doctors);
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