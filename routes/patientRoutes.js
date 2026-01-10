const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// This line will now find the function because it's no longer hidden inside updatePatientProfile
router.get("/profile/:uid", patientController.getProfile);
router.put("/update-profile", patientController.updatePatientProfile);

module.exports = router;
