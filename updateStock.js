// server/updateStock.js

// 1. IMPORT 'inventoryDb' INSTEAD OF 'db'
// We need to talk to the Inventory Database, not the Doctor Database
const { inventoryDb } = require('./config/firebase');

const addStockField = async () => {
  try {
    // Safety Check: Make sure the second database is actually connected
    if (!inventoryDb) {
        console.error("❌ Error: 'inventoryDb' is not connected.");
        console.error("Make sure you have 'inventoryKey.json' in your server folder and 'config/firebase.js' is updated.");
        return;
    }

    console.log("Fetching all medicines from Inventory Database...");
    
    // 2. USE 'inventoryDb' TO FETCH
    const snapshot = await inventoryDb.collection('medicines').get();

    if (snapshot.empty) {
      console.log("No medicines found in the Inventory Database.");
      console.log("Check if your collection name is exactly 'medicines' (case sensitive).");
      return;
    }

    const batch = inventoryDb.batch(); // Use batch from inventoryDb
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const ref = inventoryDb.collection('medicines').doc(doc.id);
      
      // Update: Set stock to 100
      batch.update(ref, { stock: 100 }); 
      count++;
    });

    await batch.commit();
    console.log(`✅ Success! Added 'stock: 100' to ${count} medicines in Inventory DB!`);

  } catch (error) {
    console.error("Error updating stock:", error);
  }
};

addStockField();