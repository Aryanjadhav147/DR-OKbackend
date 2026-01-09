const { db } = require("../config/firebase");

// --- 1. SINGLE DAY SCHEDULE (Smart Merge / Append / Edit) ---
// --- 1. SINGLE DAY SCHEDULE (Smart Merge + Schema Update) ---
exports.createSchedule = async (req, res) => {
  try {
    const { uid, date, startTime, endTime, duration, hospital } = req.body;
    const batch = db.batch();

    // 1. Calculate the NEW slots specifically requested
    const requestedTimes = generateTimeSlots(
      startTime,
      endTime,
      parseInt(duration),
    );
    const requestedTimesSet = new Set(requestedTimes);

    // 2. Fetch ALL existing slots for this day
    const existingSnapshot = await db
      .collection("slots")
      .where("doctorId", "==", uid)
      .where("date", "==", date)
      .get();

    let overwrittenCount = 0;
    let createdCount = 0;

    // 3. PHASE A: Handle Conflicts (The "Sniper" Logic)
    existingSnapshot.docs.forEach((doc) => {
      const slotData = doc.data();
      const slotRef = db.collection("slots").doc(doc.id);

      if (requestedTimesSet.has(slotData.time)) {
        // CONFLICT FOUND!
        if (slotData.isBooked) {
          // Soft Delete: Keep history, mark cancelled
          batch.update(slotRef, {
            status: "Cancelled",
            adminMessage: "Doctor updated the schedule.",
            isBooked: false,
          });
        } else {
          // Hard Delete: Remove empty slot
          batch.delete(slotRef);
        }
        overwrittenCount++;
      }
    });

    // 4. PHASE B: Write New Slots (With FULL Schema)
    requestedTimes.forEach((time) => {
      const newSlotRef = db.collection("slots").doc();
      batch.set(newSlotRef, {
        doctorId: uid,
        date: date,
        time: time,
        duration: parseInt(duration),
        hospitalName: hospital,

        // --- Booking & Status Fields ---
        isBooked: false,
        status: "Active",

        // --- Patient Placeholders (Ready for Booking) ---
        patientId: null,
        patientName: null,
        patientPhone: null, // <--- ADDED THIS FIELD

        createdAt: new Date(),
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

    if (!date || !doctorId)
      return res.status(400).json({ error: "Missing date or doctorId" });

    const snapshot = await db
      .collection("slots")
      .where("doctorId", "==", doctorId)
      .where("date", "==", date)
      .get();

    const slots = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    slots.sort((a, b) => a.time.localeCompare(b.time));
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. WEEKLY MULTI-SESSION SCHEDULE (Starts Today) ---
// --- 3. WEEKLY MULTI-SESSION SCHEDULE (With Patient Phone) ---
exports.createWeeklySchedule = async (req, res) => {
  try {
    const { uid, weeklySchedule, duration, range } = req.body;

    // Default to 7 days if not provided
    const daysToGenerate = range || 7;

    const slotsToCreate = [];
    const startDate = new Date(); // Start strictly from Today

    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // 1. Loop through Date Range (Next 7 days starting today)
    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date();
      currentDate.setDate(startDate.getDate() + i);

      const dayIndex = currentDate.getDay(); // 0 = Sun
      const dayName = dayMap[dayIndex]; // "Mon"

      const daySessions = weeklySchedule[dayName]; // Get sessions for that day

      if (daySessions && daySessions.length > 0) {
        const dateString = currentDate.toISOString().split("T")[0];

        daySessions.forEach((session) => {
          if (session.startTime && session.endTime && session.hospital) {
            // Generate time slots
            const times = generateTimeSlots(
              session.startTime,
              session.endTime,
              parseInt(duration),
            );

            times.forEach((time) => {
              slotsToCreate.push({
                doctorId: uid,
                date: dateString,
                time: time,
                hospitalName: session.hospital,

                // --- FULL SCHEMA MATCH ---
                duration: parseInt(duration),
                isBooked: false,
                status: "Active",

                // --- Patient Placeholders (Ready for Booking) ---
                patientId: null,
                patientName: null,
                patientPhone: null, // <--- ADDED THIS FIELD

                createdAt: new Date(),
              });
            });
          }
        });
      }
    }

    // 2. Single Batch Write
    if (slotsToCreate.length > 0) {
      const batch = db.batch();

      slotsToCreate.forEach((slot) => {
        const docRef = db.collection("slots").doc();
        batch.set(docRef, slot);
      });

      await batch.commit();
      return res
        .status(200)
        .json({
          message: `Success! Created ${slotsToCreate.length} slots for the next ${daysToGenerate} days.`,
        });
    } else {
      return res
        .status(200)
        .json({ message: "No slots were generated. Check your weekly plan." });
    }
  } catch (error) {
    console.error("Weekly Schedule Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- 4. SET HOLIDAY (Blocker Logic) ---
exports.setDoctorHoliday = async (req, res) => {
  try {
    const { uid, date } = req.body;
    const batch = db.batch();

    // 1. Fetch ALL existing slots for this date
    const existingSnapshot = await db
      .collection("slots")
      .where("doctorId", "==", uid)
      .where("date", "==", date)
      .get();

    let cancelledCount = 0;

    // 2. Cleanup Phase
    existingSnapshot.docs.forEach((doc) => {
      const slotData = doc.data();
      const slotRef = db.collection("slots").doc(doc.id);

      if (slotData.isBooked) {
        // Soft Delete: Keep record, but mark cancelled
        batch.update(slotRef, {
          status: "Cancelled",
          adminMessage:
            '"Appointment cancelled. doctor is on leave today. Please reschedule your visit.',
          isBooked: false,
        });
        cancelledCount++;
      } else {
        // Hard Delete: Remove empty slots completely
        batch.delete(slotRef);
      }
    });

    // 3. Blocker Phase: Create the "Holiday" Slot
    const holidayRef = db.collection("slots").doc();
    batch.set(holidayRef, {
      doctorId: uid,
      date: date,
      time: "00:00", // Placeholder time
      duration: 0, // No duration
      hospitalName: "On Leave",
      isBooked: true, // BLOCKED: No one can book this
      patientId: null,
      patientName: null,
      status: "Holiday", // SPECIAL STATUS FLAG
      createdAt: new Date(),
    });

    await batch.commit();

    res.status(200).json({
      message: `Date marked as Holiday. ${cancelledCount} existing bookings were cancelled.`,
    });
  } catch (error) {
    console.error("Set Holiday Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- HELPER FUNCTION (MUST BE AT THE BOTTOM) ---
function generateTimeSlots(start, end, duration) {
  let slots = [];
  let current = new Date(`2000-01-01T${start}`);
  let endTime = new Date(`2000-01-01T${end}`);

  while (current < endTime) {
    let h = current.getHours().toString().padStart(2, "0");
    let m = current.getMinutes().toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current.setMinutes(current.getMinutes() + duration);
  }
  return slots;
}
// --- 5. BOOK APPOINTMENT (With Doctor Snapshot) ---
exports.bookAppointment = async (req, res) => {
  // 1. Accept new fields in the request body
  const {
    slotId,
    patientId,
    patientName,
    patientPhone,
    doctorName,
    doctorSpecialization,
    doctorPhoto,
  } = req.body;

  try {
    await db.runTransaction(async (transaction) => {
      // 2. Get reference to the specific slot
      const slotRef = db.collection("slots").doc(slotId);

      // 3. READ: Get the current data inside the lock
      const slotDoc = await transaction.get(slotRef);

      if (!slotDoc.exists) {
        throw "Slot does not exist!";
      }

      const slotData = slotDoc.data();

      // 4. CHECK: The most important line
      if (slotData.isBooked === true) {
        throw "Sorry, this slot was just taken by someone else.";
      }

      // 5. WRITE: Update the slot with Patient AND Doctor Snapshot
      transaction.update(slotRef, {
        isBooked: true,
        status: "Booked",

        // Patient Info
        patientId: patientId,
        patientName: patientName,
        patientPhone: patientPhone || null,

        // Doctor Snapshot (Saved for easy display on Patient Dashboard)
        doctorName: doctorName,
        doctorSpecialization: doctorSpecialization,
        doctorPhoto: doctorPhoto || null,
      });
    });

    // If transaction finishes without throwing errors:
    res.status(200).json({ message: "Appointment Confirmed Successfully!" });
  } catch (error) {
    console.error("Booking Error:", error);
    // Send a 409 (Conflict) if it was a double-booking attempt
    const status = error.toString().includes("taken") ? 409 : 500;
    res.status(status).json({ error: error.toString() });
  }
};
// --- 6. GET PATIENT BOOKINGS (For Patient Dashboard) ---
exports.getPatientBookings = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: "Missing Patient ID" });
    }

    // Fetch all slots booked by this patient
    const snapshot = await db
      .collection("slots")
      .where("patientId", "==", patientId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]); // Return empty array if no bookings
    }

    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    // Sort by Date & Time (Newest First)
    bookings.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB - dateA; // Descending order
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch Patient Bookings Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- 7. GET DOCTOR APPOINTMENT HISTORY (Who booked me?) ---
exports.getDoctorAppointmentHistory = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ error: "Missing Doctor ID" });
    }

    // Query: Find slots for this doctor that are BOOKED
    const snapshot = await db
      .collection("slots")
      .where("doctorId", "==", doctorId)
      .where("isBooked", "==", true) // We only care about booked slots
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]); // Return empty list if no bookings found
    }

    const appointments = [];
    snapshot.docs.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });

    // Sort by Date & Time (Newest First)
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB - dateA; // Descending order (Latest first)
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Fetch Appointment History Error:", error);
    res.status(500).json({ error: error.message });
  }
};
