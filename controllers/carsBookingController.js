const carsBookingService = require("../services/carsBookingService");

class CarsBookingController {
    async getFreeCars(req, res) {
        const {startDate, endDate} = req.body;
        const cars = await carsBookingService.getFreeCars(startDate, endDate);
        res.json(cars);
    }

    async orderCar(req, res) {
        const {carId, startDate, endDate} = req.body;
        const order = await carsBookingService.orderCar(carId, startDate, endDate);
        res.json(order);
    }

    async getCarsWorkload(req, res) {
        const {start, end} = req.body;
        const workload = await carsBookingService.getCarsWorkload(start, end);
        res.json(workload);
    }
}

module.exports = new CarsBookingController();