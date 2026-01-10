const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// Line 4 (The one causing the crash in the logs)
// It will work now because getProfile is properly exported above
router.get("/profile/:uid", patientController.getProfile);
router.put("/update-profile", patientController.updatePatientProfile);

module.exports = router;
