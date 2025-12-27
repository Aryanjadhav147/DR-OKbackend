// Import both DBs
const { db, inventoryDb, admin } = require('../config/firebase'); 

// --- API 1: SEARCH MEDICINES (Look inside Inventory DB) ---
exports.searchMedicines = async (req, res) => {
  try {
    const { query } = req.query; 
    if (!query) return res.json([]);
    if (!inventoryDb) return res.status(500).json({ error: "Inventory DB not connected" });

    // Use 'inventoryDb' to search
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

// --- API 2: CREATE PRESCRIPTION (Hybrid Logic) ---
exports.createPrescription = async (req, res) => {
  try {
    const { doctorId, patientId, medicines, diagnosis, date } = req.body;

    // 1. Save Prescription to DOCTOR DB ('db')
    await db.collection('prescriptions').add({
      doctorId,
      patientId,
      diagnosis,
      medicines, 
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date()
    });

    // 2. Deduct Stock from INVENTORY DB ('inventoryDb')
    // Note: We cannot use a Batch across two different databases. 
    // We must update them one by one.
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

    res.status(200).json({ message: "Prescription saved and Stock updated!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};