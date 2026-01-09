const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

// 1. Create Single Day Schedule
router.post("/create-schedule", scheduleController.createSchedule);

// 2. Get Slots for a Specific Date
router.get("/doctor-slots/:doctorId", scheduleController.getDoctorSlots);

// 3. Create Weekly Multi-Session Schedule
router.post("/create-schedule-weekly", scheduleController.createWeeklySchedule);
router.post("/set-holiday", scheduleController.setDoctorHoliday);
router.post("/book-appointment", scheduleController.bookAppointment);
router.get(
  "/my-doctor-bookings/:patientId",
  scheduleController.getPatientBookings,
);
router.get(
  "/doctor-appointment-history/:doctorId",
  scheduleController.getDoctorAppointmentHistory,
);

module.exports = router;
