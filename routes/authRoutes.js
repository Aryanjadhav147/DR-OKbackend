const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register-patient', authController.registerPatient);
router.post('/register-doctor', authController.registerDoctor);
router.get('/get-role/:uid', authController.getRole);

// --- NEW ROUTE LINKS ---
router.post('/request-agent', authController.requestAgent);
router.put('/verify-doctor', authController.verifyDoctor);

module.exports = router;