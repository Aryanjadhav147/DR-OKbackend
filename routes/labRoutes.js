const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');

// Route to get list of all labs
router.get('/all-labs', labController.getAllLabs);

// Route to create a new booking
router.post('/book-test', labController.bookLabTest);

// Route to get a specific patient's history
router.get('/my-bookings/:patientId', labController.getPatientBookings);

module.exports = router;