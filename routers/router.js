const express = require('express');
const router = express.Router();

const carsBookingController = require('../controllers/carsBookingController');
const dispatchErrors = require('../controllers/errorsDispatcherController');

router.get('/cars', dispatchErrors(carsBookingController.getFreeCars));
router.post('/cars/orders', dispatchErrors(carsBookingController.orderCar));

module.exports = router;