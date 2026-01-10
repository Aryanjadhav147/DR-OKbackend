const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
router.get("/profile/:uid", patientController.getProfile);
router.put("/update-profile", patientController.updatePatientProfile);

module.exports = router;
