const { db, inventoryDb, admin } = require('../config/firebase');

// --- API 1: SEARCH MEDICINES (Robust Case-Insensitive) ---
exports.searchMedicines = async (req, res) => {
  try {
    const { query } = req.query; 
    if (!query) return res.json([]);
    if (!inventoryDb) return res.status(500).json({ error: "Inventory DB not connected" });

    // 1. Prepare Variations
    const termExact = query;                                      // e.g. "dolo"
    const termTitle = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase(); // e.g. "Dolo"
    const termCaps = query.toUpperCase();                         // e.g. "DOLO"

    // console.log(`🔍 Searching for: "${termExact}", "${termTitle}", "${termCaps}"`);

    // 2. Run 3 Parallel Queries
    const [snapExact, snapTitle, snapCaps] = await Promise.all([
        // Query 1: Exact Match
        inventoryDb.collection('medicines')
            .where('brand_name', '>=', termExact)
            .where('brand_name', '<=', termExact + '\uf8ff')
            .limit(5).get(),
        // Query 2: Title Case (Most likely to succeed)
        inventoryDb.collection('medicines')
            .where('brand_name', '>=', termTitle)
            .where('brand_name', '<=', termTitle + '\uf8ff')
            .limit(5).get(),
        // Query 3: All Caps
        inventoryDb.collection('medicines')
            .where('brand_name', '>=', termCaps)
            .where('brand_name', '<=', termCaps + '\uf8ff')
            .limit(5).get()
    ]);

    // 3. Merge Results & Remove Duplicates
    const allDocs = new Map();

    const processDoc = (doc) => {
        if (!allDocs.has(doc.id)) {
            allDocs.set(doc.id, doc.data());
        }
    };

    snapExact.docs.forEach(processDoc);
    snapTitle.docs.forEach(processDoc);
    snapCaps.docs.forEach(processDoc);

    // 4. Format Data for Frontend
    const medicines = Array.from(allDocs.entries()).map(([id, data]) => {
        return {
            id: id,
            ...data, // Include batches, pack_type etc.
            name: data.brand_name, 
            composition: data.composition_details?.name || '', 
            stock: data.total_stock || data.stock || 0 
        };
    });

    // console.log(`✅ Found ${medicines.length} results.`);
    res.json(medicines);

  } catch (error) {
    console.error("❌ Search Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// --- API 2: CREATE PRESCRIPTION (UPDATED: Saves Name & Phone) ---
exports.createPrescription = async (req, res) => {
  try {
    // 1. EXTRACT DATA (Added doctorName & attachmentUrl)
    const { doctorId, doctorName, patientName, phoneNumber, diagnosis, medicines, attachmentUrl } = req.body;

    // 2. CREATE PRESCRIPTION DOCUMENT
    const prescriptionRef = db.collection('prescriptions').doc();
    
    // --- DATE FIX START ---
    // Create a clean date string (e.g., "2025-10-25") for easy display
    const today = new Date().toISOString().split('T')[0]; 
    // --- DATE FIX END ---

    await prescriptionRef.set({
      doctorId,
      doctorName: doctorName || "Unknown Doctor", // Save the name!
      patientName,
      phoneNumber,
      diagnosis,
      medicines,
      attachmentUrl: attachmentUrl || null,
      
      createdAt: new Date().toISOString(), // Exact timestamp for sorting
      date: today // <--- THIS SAVES THE CLEAN DATE
    });

    // 3. DEDUCT INVENTORY (Unchanged Logic)
    for (const item of medicines) {
      if (!item.inventoryId) continue; 

      const medRef = inventoryDb.collection('medicines').doc(item.inventoryId);
      const medSnap = await medRef.get();

      if (medSnap.exists) {
        const medData = medSnap.data();
        let updateData = {};

        if (item.batchId && medData.batches) {
          const updatedBatches = medData.batches.map(batch => {
            if (batch.batch_id === item.batchId) {
              const newQty = (batch.stock_quantity || 0) - (item.quantity || 1);
              return { ...batch, stock_quantity: newQty < 0 ? 0 : newQty };
            }
            return batch;
          });
          updateData.batches = updatedBatches;
          if (medData.total_stock !== undefined) {
             updateData.total_stock = medData.total_stock - (item.quantity || 1);
          }
        } else {
           const currentStock = medData.stock || 0;
           updateData.stock = currentStock - (item.quantity || 1);
        }
        await medRef.update(updateData);
      }
    }

    res.status(200).json({ message: 'Prescription Saved & Inventory Updated!' });

  } catch (error) {
    console.error("Prescription Error:", error);
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
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params; // We get the Doctor's ID from the URL

    if (!doctorId) {
        return res.status(400).json({ error: "Doctor ID is required" });
    }

    // QUERY: "Find all prescriptions where doctorId matches AND sort by newest"
    const snapshot = await db.collection('prescriptions')
      .where('doctorId', '==', doctorId)
      .orderBy('createdAt', 'desc') // Newest first
      .get();

    // Convert database documents into a clean list
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(history);

  } catch (error) {
    console.error("Error fetching doctor history:", error);
    res.status(500).json({ 
        // Send the error message so we can see if it's an Index Error
        error: error.message 
    });
  }
};