const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// Existing routes (example)
// router.post('/register', patientController.register);
// router.post('/login', patientController.login);

// --- ⚠️ ADD THIS NEW ROUTE ---
router.put("/update-profile", patientController.updatePatientProfile);

module.exports = router;
