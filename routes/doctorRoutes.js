const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");

// 1. Get All Doctors
router.get("/all-doctors", doctorController.getAllDoctors);

// 2. Get Prescription History
router.get("/doctor-history/:uid", doctorController.getDoctorHistory);

// 3. Update Profile
router.put("/update-profile", doctorController.updateDoctorProfile);
// 1. Find Doctors
router.get("/find-doctors", doctorController.getAllDoctors);

module.exports = router;
