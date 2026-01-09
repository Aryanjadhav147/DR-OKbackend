const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Registration
router.post("/register-patient", authController.registerPatient);
router.post("/register-doctor", authController.registerDoctor);
router.post("/register-lab", authController.registerLab);

// Login
router.get("/get-role/:uid", authController.getRole);

// Agent Actions
router.post("/request-agent", authController.requestAgent);
router.put("/verify-doctor", authController.verifyDoctor); // Separate Route
router.put("/verify-lab", authController.verifyLab); // Separate Route

module.exports = router;
