const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');

// --- PATIENT SIDE ROUTES ---

// 1. Get List of All Labs
// Used in: BookLab.jsx (to show the list of labs to the patient)
router.get('/all-labs', labController.getAllLabs);

// 2. Create a New Booking
// Used in: BookLab.jsx (when patient clicks "Confirm Booking")
router.post('/book-test', labController.bookLabTest);

// 3. Get Specific Patient's History
// Used in: PatientDashboard.jsx (to show "My Lab Bookings")
router.get('/my-bookings/:patientId', labController.getPatientBookings);


// --- LAB TECHNICIAN SIDE ROUTES ---

// 4. Get All Bookings for a Specific Lab
// Used in: LabDashboard.jsx (to show the list of incoming patients)
router.get('/lab-bookings/:labId', labController.getLabBookings);

// 5. Update Booking Status (Accept, Sample Collected, Complete)
// Used in: LabDashboard.jsx (Action Buttons)
//  FIX: Changed to PUT and '/update-status' to match Frontend
router.put('/update-status', labController.updateBookingStatus);

// 6. Manage Services (Add/Remove Tests)
// Used in: LabDashboard.jsx (Test Menu Tab)
router.post('/update-services', labController.updateLabServices);

// 7. Update Lab Settings (Schedule & Holidays)
// Used in: LabDashboard.jsx (Schedule Tab)
router.post('/update-settings', labController.updateLabSettings);
// 8. Update Profile (Photo & Details)
router.put('/update-profile', labController.updateLabProfile);

module.exports = router;