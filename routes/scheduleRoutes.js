const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/create-schedule', scheduleController.createSchedule);
router.get('/doctor-slots/:doctorId', scheduleController.getDoctorSlots);

module.exports = router;