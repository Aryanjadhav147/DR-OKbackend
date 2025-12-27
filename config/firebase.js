// server/config/firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// --- 1. DOCTOR DB ---
let serviceAccountDoctor;
if (process.env.DOCTOR_CREDENTIALS) {
  // Read from Vercel (String)
  serviceAccountDoctor = JSON.parse(process.env.DOCTOR_CREDENTIALS);
} else {
  // Read from Laptop (File)
  serviceAccountDoctor = require("../serviceAccountKey.json");
}

const doctorApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountDoctor)
}, "doctorApp");

const db = doctorApp.firestore();

// --- 2. INVENTORY DB ---
let serviceAccountInventory;
let inventoryDb = null;

if (process.env.INVENTORY_CREDENTIALS) {
  // Read from Vercel (String)
  serviceAccountInventory = JSON.parse(process.env.INVENTORY_CREDENTIALS);
} else {
  // Read from Laptop (File)
  try {
    serviceAccountInventory = require("../inventoryKey.json");
  } catch (e) { console.log("No local inventory key found"); }
}

if (serviceAccountInventory) {
    const inventoryApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountInventory)
    }, "inventoryApp");
    inventoryDb = inventoryApp.firestore();
}

module.exports = { admin, db, inventoryDb };