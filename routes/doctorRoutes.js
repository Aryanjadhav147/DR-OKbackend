const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/find-doctors', doctorController.findDoctors);

module.exports = router;