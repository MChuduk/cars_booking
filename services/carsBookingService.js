const db = require("../db");

class CarsBookingService {
    async getFreeCars(startDate, endDate) {


        const {baseOrderCost, orderCoolDown} = await this.getServiceConstants();
        const start = this.dateFromString(startDate);
        const end = this.dateFromString(endDate);

        console.log(this.getOrderCost(start, end, baseOrderCost));

        if (!this.isValidDateInterval(start, end))
            throw new Error("End date should be greater than start date");

        if (!this.isBusinessDate(start) || !this.isBusinessDate(end))
            throw new Error("You can order a car only in business dates");

        if (!this.isValidOrderRange(start, end, orderCoolDown))
            throw new Error("You can order a car only for 30 days");

        const result = await db.query("select * from get_free_cars($1, $2)", [startDate, endDate]);
        return result;
    }

    async orderCar(carId, startDate, endDate) {

    }

    getOrderCost(startDate, endDate, baseOrderCost) {
        const days = this.getDaysBetween(startDate, endDate);
        let price = 0;
        for (let i = 1; i <= days; i++) {
            price += baseOrderCost - baseOrderCost * this.getDiscountByDay(i);
        }

        return price;
    }

    getDiscountByDay(day) {
        const discount = new Map([
            [{start: 1, end: 4}, 0],
            [{start: 5, end: 9}, 0.05],
            [{start: 10, end: 17}, 0.1],
            [{start: 18, end: 30}, 0.15]
        ]);

        for (let key of discount.keys()) {
            if (this.isInterval(key, day)) {
                console.log(discount.get(key));
                return discount.get(key);
            }
        }
    }

    isInterval(interval, value) {
        return (value >= interval.start && value <= interval.end);
    }

    async getServiceConstants() {
        const {rows} = await db.query("select * from service_constants");
        return {baseOrderCost: rows[0].base_cost, orderCoolDown: rows[0].car_order_cooldown};
    }

    isValidOrderRange(startDate, endDate, orderCoolDown) {
        return (this.getDaysBetween(startDate, endDate) <= orderCoolDown)
    }

    isValidDateInterval(startDate, endDate) {
        return (endDate >= startDate);
    }

    isBusinessDate(date) {
        return (date.getDay() >= 1 && date.getDay() <= 5);
    }

    dateFromString(dateString) {
        return new Date(Date.parse(dateString));
    }

    getDaysBetween(startDate, endDate) {
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        return ((endDate - startDate) / oneDayInMilliseconds);
    }
}

module.exports = new CarsBookingService();