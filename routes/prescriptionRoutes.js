const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// --- ROUTE 1: THE SEARCH LINE ---
// Technical: GET request to find data in the Inventory DB
// Real World: The Doctor asking, "Do we have Dolo?"
router.get('/search-medicines', prescriptionController.searchMedicines);

// --- ROUTE 2: THE SUBMIT BUTTON ---
// Technical: POST request to save data to Doctor DB + Update Inventory DB
// Real World: The Doctor signing the paper and the Pharmacist handing over the meds.
router.post('/create-prescription', prescriptionController.createPrescription);

module.exports = router;