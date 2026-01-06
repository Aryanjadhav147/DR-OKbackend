const { db } = require('../config/firebase');

// --- 1. SINGLE DAY SCHEDULE (Smart Merge / Append / Edit) ---
exports.createSchedule = async (req, res) => {
  try {
    const { uid, date, startTime, endTime, duration, hospital } = req.body;
    const batch = db.batch();
    
    // 1. Calculate the NEW slots specifically requested
    // (These are the only times we will touch)
    const requestedTimes = generateTimeSlots(startTime, endTime, parseInt(duration));
    const requestedTimesSet = new Set(requestedTimes); // For fast lookup

    // 2. Fetch ALL existing slots for this day
    const existingSnapshot = await db.collection('slots')
      .where('doctorId', '==', uid)
      .where('date', '==', date)
      .get();

    let overwrittenCount = 0;
    let createdCount = 0;

    // 3. PHASE A: Handle Conflicts (The "Sniper" Logic)
    // We only look at existing slots that MATCH the requested times.
    existingSnapshot.docs.forEach(doc => {
        const slotData = doc.data();
        const slotRef = db.collection('slots').doc(doc.id);

        // If this existing slot is in our new list...
        if (requestedTimesSet.has(slotData.time)) {
            // CONFLICT FOUND! We need to clear this spot.
            
            if (slotData.isBooked) {
                // Safety: Don't delete history. Mark as Cancelled.
                batch.update(slotRef, {
                    status: 'Cancelled',
                    adminMessage: 'Doctor updated the schedule.',
                    isBooked: false
                });
            } else {
                // Empty slot? Delete it to make room for the new one.
                batch.delete(slotRef);
            }
            overwrittenCount++;
        }
        // If it's NOT in our list (e.g. 9 AM slot when adding 5 PM), we do NOTHING. 
        // It stays safe.
    });

    // 4. PHASE B: Write New Slots
    requestedTimes.forEach(time => {
        const newSlotRef = db.collection('slots').doc();
        batch.set(newSlotRef, {
            doctorId: uid,
            date: date,
            time: time,
            duration: parseInt(duration),
            hospitalName: hospital,
            isBooked: false,
            patientId: null,
            patientName: null,
            status: 'Active',
            createdAt: new Date()
        });
        createdCount++;
    });

    // 5. Commit everything
    await batch.commit();

    // Smart Feedback Message
    let msg = "";
    if (overwrittenCount > 0) {
        msg = `Updated! Replaced ${overwrittenCount} old slots and added ${createdCount - overwrittenCount} new ones.`;
    } else {
        msg = `Success! Added ${createdCount} new slots to your day.`;
    }

    res.status(200).json({ message: msg });

  } catch (error) {
    console.error("Create Schedule Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- 2. GET SLOTS (Existing) ---
exports.getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query; 
    const { doctorId } = req.params; 
    
    if (!date || !doctorId) return res.status(400).json({ error: "Missing date or doctorId" });

    const snapshot = await db.collection('slots')
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .get();
    
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    slots.sort((a, b) => a.time.localeCompare(b.time));
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. WEEKLY MULTI-SESSION SCHEDULE (Starts Today) ---
exports.createWeeklySchedule = async (req, res) => {
  try {
    const { uid, weeklySchedule, duration, range } = req.body;
    
    // Default to 7 days if not provided
    const daysToGenerate = range || 7;

    const slotsToCreate = [];
    const startDate = new Date(); // Start strictly from Today
    
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 1. Loop through Date Range (Next 7 days starting today)
    for (let i = 0; i < daysToGenerate; i++) {
        const currentDate = new Date();
        currentDate.setDate(startDate.getDate() + i);
        
        const dayIndex = currentDate.getDay(); // 0 = Sun
        const dayName = dayMap[dayIndex];      // "Mon"
        
        const daySessions = weeklySchedule[dayName]; // Get sessions for that day

        if (daySessions && daySessions.length > 0) {
            const dateString = currentDate.toISOString().split('T')[0];

            daySessions.forEach(session => {
                if (session.startTime && session.endTime && session.hospital) {
                    
                    // Generate time slots 
                    const times = generateTimeSlots(session.startTime, session.endTime, parseInt(duration));
                    
                    times.forEach(time => {
                        slotsToCreate.push({
                            doctorId: uid,
                            date: dateString,
                            time: time,
                            hospitalName: session.hospital,
                            
                            // --- ADDED MISSING FIELDS TO MATCH SCHEMA ---
                            duration: parseInt(duration), 
                            isBooked: false,
                            patientId: null,    
                            patientName: null,  
                            status: 'Active',   
                            createdAt: new Date()
                        });
                    });
                }
            });
        }
    }

    // 2. Single Batch Write
    if (slotsToCreate.length > 0) {
        const batch = db.batch();
        
        slotsToCreate.forEach(slot => {
            const docRef = db.collection('slots').doc(); 
            batch.set(docRef, slot);
        });

        await batch.commit();
        return res.status(200).json({ message: `Success! Created ${slotsToCreate.length} slots for the next ${daysToGenerate} days.` });
    } else {
        return res.status(200).json({ message: "No slots were generated. Check your weekly plan." });
    }

  } catch (error) {
    console.error("Weekly Schedule Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- HELPER FUNCTION (MUST BE AT THE BOTTOM) ---
function generateTimeSlots(start, end, duration) {
    let slots = [];
    let current = new Date(`2000-01-01T${start}`);
    let endTime = new Date(`2000-01-01T${end}`);

    while (current < endTime) {
        let h = current.getHours().toString().padStart(2, '0');
        let m = current.getMinutes().toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
        current.setMinutes(current.getMinutes() + duration);
    }
    return slots;
}
// --- 4. SET HOLIDAY (Blocker Logic) ---
exports.setDoctorHoliday = async (req, res) => {
  try {
    const { uid, date } = req.body;
    const batch = db.batch();

    // 1. Fetch ALL existing slots for this date
    const existingSnapshot = await db.collection('slots')
      .where('doctorId', '==', uid)
      .where('date', '==', date)
      .get();

    let cancelledCount = 0;

    // 2. Cleanup Phase
    existingSnapshot.docs.forEach(doc => {
        const slotData = doc.data();
        const slotRef = db.collection('slots').doc(doc.id);

        if (slotData.isBooked) {
            // Soft Delete: Keep record, but mark cancelled
            batch.update(slotRef, {
                status: 'Cancelled',
                adminMessage: 'Appointment cancelled. Doctor is on leave.',
                isBooked: false 
            });
            cancelledCount++;
        } else {
            // Hard Delete: Remove empty slots completely
            batch.delete(slotRef);
        }
    });

    // 3. Blocker Phase: Create the "Holiday" Slot
    const holidayRef = db.collection('slots').doc();
    batch.set(holidayRef, {
        doctorId: uid,
        date: date,
        time: "00:00",       // Placeholder time
        duration: 0,         // No duration
        hospitalName: "On Leave",
        isBooked: true,      // BLOCKED: No one can book this
        patientId: null,
        patientName: null,
        status: 'Holiday',   // SPECIAL STATUS FLAG
        createdAt: new Date()
    });

    await batch.commit();

    res.status(200).json({ 
        message: `Date marked as Holiday. ${cancelledCount} existing bookings were cancelled.` 
    });

  } catch (error) {
    console.error("Set Holiday Error:", error);
    res.status(500).json({ error: error.message });
  }
};