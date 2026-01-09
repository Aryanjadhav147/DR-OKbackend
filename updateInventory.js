const { db } = require("./config/firebase"); // Ensure this path matches your setup

const updateMedicine = async () => {
  try {
    const medicineId = "01ID"; // The ID from your screenshot for Dolo 650

    console.log(`🔄 Updating medicine: ${medicineId}...`);

    await db
      .collection("medicines")
      .doc(medicineId)
      .update({
        // 1. Add the Helper Fields
        total_stock: 70,
        pack_type: "Strip",

        // 2. Add the Batches Array
        batches: [
          {
            batch_id: "BATCH-001",
            pack_size: 15, // 15 tablets per strip
            stock_quantity: 50, // 50 strips available
            expiry: "2025-12-31",
            mrp: 30.0,
            location: "Shelf A1",
          },
          {
            batch_id: "BATCH-002",
            pack_size: 10, // 10 tablets per strip
            stock_quantity: 20, // 20 strips available
            expiry: "2024-10-15",
            mrp: 18.5,
            location: "Shelf A1",
          },
        ],
      });

    console.log("✅ Medicine updated successfully with Batches!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
};

updateMedicine();
