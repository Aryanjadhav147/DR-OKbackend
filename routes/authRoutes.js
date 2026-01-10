const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Registration
router.post("/register-patient", authController.registerPatient);
router.post("/register-doctor", authController.registerDoctor);
router.post("/register-lab", authController.registerLab);

// Role Checking (Used in Login flow)
router.get("/get-role/:uid", authController.getRole);

// Admin/Agent Actions
router.post("/request-agent", authController.requestAgent);
router.put("/verify-doctor", authController.verifyDoctor);
router.put("/verify-lab", authController.verifyLab);

module.exports = router;
