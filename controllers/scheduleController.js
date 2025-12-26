const { db } = require('../config/firebase');

exports.createSchedule = async (req, res) => {
  try {
    const { uid, date, startTime, endTime, duration, hospital } = req.body;
    const slotsBatch = db.batch();
    const slotsRef = db.collection('slots');

    // Check existing
    const existingSnapshot = await slotsRef
      .where('doctorId', '==', uid).where('date', '==', date).get();
    const existingTimes = new Set(existingSnapshot.docs.map(doc => doc.data().time));

    const toMinutes = (str) => { const [h, m] = str.split(':').map(Number); return h * 60 + m; };
    let current = toMinutes(startTime);
    const end = toMinutes(endTime);
    const dur = parseInt(duration);
    let created = 0;

    while (current + dur <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;

      if (!existingTimes.has(timeStr)) {
        const newSlot = slotsRef.doc();
        slotsBatch.set(newSlot, {
          doctorId: uid, hospitalName: hospital, date, time: timeStr,
          isBooked: false, patientId: null, patientName: null, createdAt: new Date()
        });
        created++;
      }
      current += dur;
    }

    if (created > 0) {
      await slotsBatch.commit();
      return res.status(200).json({ message: `Success! Created ${created} new slots.` });
    } else {
      return res.status(400).json({ error: "No new slots created (slots may already exist)." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const { doctorId } = req.params;
    const snapshot = await db.collection('slots')
      .where('doctorId', '==', doctorId).where('date', '==', date).get();
    
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    slots.sort((a, b) => a.time.localeCompare(b.time));
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};