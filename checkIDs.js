const { db } = require('./config/firebase');

const listMedicines = async () => {
  console.log("🔍 Scanning Medicines Collection...");
  const snapshot = await db.collection('medicines').get();
  
  if (snapshot.empty) {
    console.log("❌ No documents found! Check if collection name is 'medicines' or 'medicine'.");
  } else {
    snapshot.forEach(doc => {
      console.log(`✅ Found Document ID: "${doc.id}"  (Name: ${doc.data().brand_name})`);
    });
  }
};

listMedicines();