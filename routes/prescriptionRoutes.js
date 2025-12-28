const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// Search
router.get('/search-medicines', prescriptionController.searchMedicines);

// Create (Now uses Name + Phone)
router.post('/create-prescription', prescriptionController.createPrescription);

// NEW: Get Prescriptions (For Patient)
router.get('/my-prescriptions', prescriptionController.getMyPrescriptions);

module.exports = router;