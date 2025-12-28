const { db, inventoryDb, admin } = require('../config/firebase');

// --- API 1: SEARCH MEDICINES (Unchanged) ---
exports.searchMedicines = async (req, res) => {
  try {
    const { query } = req.query; 
    if (!query) return res.json([]);
    if (!inventoryDb) return res.status(500).json({ error: "Inventory DB not connected" });

    const snapshot = await inventoryDb.collection('medicines') 
      .where('brand_name', '>=', query)
      .where('brand_name', '<=', query + '\uf8ff')
      .limit(10)
      .get();

    const medicines = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.brand_name, 
            composition: data.composition_details?.name || '', 
            stock: data.stock || 0 
        };
    });

    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- API 2: CREATE PRESCRIPTION (UPDATED: Saves Name & Phone) ---
exports.createPrescription = async (req, res) => {
  try {
    const { 
      doctorId, 
      patientName,  // <--- Manual Input
      phoneNumber,  // <--- Manual Input (The Key)
      medicines, 
      diagnosis, 
      date 
    } = req.body;

    // Validate
    if (!patientName || !phoneNumber) {
      return res.status(400).json({ error: "Patient Name and Phone Number are required." });
    }

    // 1. Save to Doctor DB
    await db.collection('prescriptions').add({
      doctorId,
      patientName, 
      phoneNumber, 
      diagnosis,
      medicines, 
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date()
    });

    // 2. Deduct Stock from Inventory DB
    if (inventoryDb) {
        const updatePromises = medicines.map(med => {
            if (med.inventoryId) {
                const medRef = inventoryDb.collection('medicines').doc(med.inventoryId);
                return medRef.update({
                    stock: admin.firestore.FieldValue.increment(-med.quantity)
                });
            }
        });
        await Promise.all(updatePromises);
    }

    res.status(200).json({ message: `Prescription sent to ${patientName} (${phoneNumber})` });

  } catch (error) {
    console.error("Create Prescription Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- API 3: FETCH MY PRESCRIPTIONS (For Patient Dashboard) ---
exports.getMyPrescriptions = async (req, res) => {
  try {
    const { phoneNumber } = req.query; // Patient sends their phone number

    if (!phoneNumber) return res.json([]);

    // Fetch ALL prescriptions linked to this phone number
    const snapshot = await db.collection('prescriptions')
      .where('phoneNumber', '==', phoneNumber)
      .orderBy('createdAt', 'desc')
      .get();

    const prescriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};