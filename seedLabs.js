const { db } = require("./config/firebase"); // Uses your existing server config

const labs = [
  {
    name: "City Pathology Lab",
    address: "Shop 4, Station Road, Thane West",
    // We store location as { lat, lng }
    location: { lat: 19.1983, lng: 72.9575 },
    openingHours: "08:00 AM - 09:00 PM",
    slots: [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "01:00 PM",
      "03:00 PM",
      "05:00 PM",
    ],
    tests: [
      {
        id: "t1",
        name: "Complete Blood Count (CBC)",
        price: 450,
        preparation: "None",
      },
      {
        id: "t2",
        name: "Fasting Blood Sugar",
        price: 200,
        preparation: "Fasting 10-12 hours",
      },
      {
        id: "t3",
        name: "Thyroid Profile (T3, T4, TSH)",
        price: 800,
        preparation: "None",
      },
    ],
  },
  {
    name: "Metro X-Ray & Diagnostics",
    address: "LBS Marg, Mulund West",
    location: { lat: 19.1726, lng: 72.9425 },
    openingHours: "09:00 AM - 10:00 PM",
    slots: ["10:00 AM", "11:00 AM", "12:00 PM", "04:00 PM", "06:00 PM"],
    tests: [
      {
        id: "t4",
        name: "Chest X-Ray",
        price: 600,
        preparation: "Remove metal objects",
      },
      {
        id: "t5",
        name: "MRI Scan (Brain)",
        price: 4500,
        preparation: "Appointment Required",
      },
      {
        id: "t1",
        name: "Complete Blood Count (CBC)",
        price: 500,
        preparation: "None",
      },
    ],
  },
  {
    name: "Apollo Diagnostics Center",
    address: "Hiranandani Estate, Thane",
    location: { lat: 19.2536, lng: 72.9739 },
    openingHours: "07:00 AM - 08:00 PM",
    slots: ["07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "05:00 PM"],
    tests: [
      {
        id: "t6",
        name: "Lipid Profile",
        price: 750,
        preparation: "Fasting 12 hours",
      },
      { id: "t7", name: "Vitamin D Test", price: 1200, preparation: "None" },
      {
        id: "t2",
        name: "Fasting Blood Sugar",
        price: 250,
        preparation: "Fasting 10-12 hours",
      },
    ],
  },
];

const seedLabs = async () => {
  try {
    console.log("🌱 Starting to seed labs...");

    for (const lab of labs) {
      // Add each lab to the 'labs' collection
      await db.collection("labs").add(lab);
      console.log(`✅ Added: ${lab.name}`);
    }

    console.log("🎉 All labs added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding labs:", error);
    process.exit(1);
  }
};

seedLabs();
