const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// 1. Create Single Day Schedule
router.post('/create-schedule', scheduleController.createSchedule);

// 2. Get Slots for a Specific Date
router.get('/doctor-slots/:doctorId', scheduleController.getDoctorSlots);

// 3. Create Weekly Multi-Session Schedule (New Route ✅)
router.post('/create-schedule-weekly', scheduleController.createWeeklySchedule);
router.post('/set-holiday', scheduleController.setDoctorHoliday);

module.exports = router;