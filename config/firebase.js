const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

let serviceAccount;

// LOGIC: Check if we are running on Vercel (Env Var) or Local (File)
try {
  if (process.env.GOOGLE_CREDENTIALS) {
    // SCENARIO 1: We are on Vercel
    serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log("Loaded Firebase credentials from Environment Variable");
  } else {
    // SCENARIO 2: We are on Localhost
    // FIX: Changed path from './' to '../' because we are now inside the 'config' folder
    serviceAccount = require("../serviceAccountKey.json"); 
    console.log("Loaded Firebase credentials from local file");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("Firebase Admin Initialized Successfully");

} catch (error) {
  console.error("Firebase Initialization Error:", error.message);
}

const db = admin.firestore();

// Export 'admin' (for auth) and 'db' (for database)
module.exports = { admin, db };