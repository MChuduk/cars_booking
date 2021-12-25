const db = require("../db");

class CarsBookingService {
    async getFreeCars(startDate, endDate) {
        const {orderCooldown} = await this.getServiceConstants();
        const start = this.dateFromString(startDate);
        const end = this.dateFromString(endDate);

        if (!this.isValidDateInterval(start, end))
            throw new Error("End date should be greater than start date");

        if (!this.isBusinessDate(start) || !this.isBusinessDate(end))
            throw new Error("You can order a car only in business dates");

        if (!this.isValidOrderRange(start, end, orderCooldown))
            throw new Error("You can order a car only for 30 days");

        const result = await db.query("select get_free_cars($1) as car_id", [startDate]);
        return result;
    }

    async orderCar(carId, startDate, endDate) {
        const start = this.dateFromString(startDate);
        const end = this.dateFromString(endDate);

        const {baseOrderCost} = await this.getServiceConstants();
        const orderCost =  this.getOrderCost(start, end, baseOrderCost)

        const result = await db.query("insert into order_sessions(car_id, start_date, end_date, order_cost) " +
            "values($1, $2, $3, $4)", [carId, startDate, endDate, orderCost]);

        return {message: "Your car order was applied", car_id: carId, start: startDate, end: endDate, cost: orderCost};
    }

    async getCarsWorkload(startMonth, endMonth) {
        let { rows } = await db.query("select car_id, start_date, end_date from order_sessions" +
            " where start_date >= $1 and end_date <= $2", [startMonth, endMonth]);
        const report = [];

        for(let i = 0; i < rows.length; i++) {
            const order = rows[i];
            const start_month = this.dateFromString(startMonth);
            const end_month = this.dateFromString(endMonth);
            const start_order = this.dateFromString(order.start_date);
            const end_order = this.dateFromString(order.end_date);

            const workload = this.getWorkload(start_month, end_month, start_order, end_order);
            report.push({car_id: order.car_id, worload: workload.toFixed(2)})
        }

        const car_ids = await this.getCarsId();
        for(let i = 0; i < car_ids.length; i++) {
            report.push({car_id: car_ids[i], worload: "0.00"})
        }
        return report;
    }

    async getServiceConstants() {
        const {rows} = await db.query("select * from service_constants");
        return {baseOrderCost: rows[0].base_order_cost, orderMaxPeriod: rows[0].car_order_max_period, orderCooldown: rows[0].car_order_cooldown};
    }

    async getCarsId() {
        let { rows } = await db.query("select cars.car_id from cars left join order_sessions on cars.car_id = order_sessions.car_id where order_sessions.car_id is null");
        const ids = [];

        for(let i = 0; i < rows.length; i++) {
            const car = rows[i];
            ids.push(car.car_id)
        }
        return ids;
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

    getWorkload(startMonth, endMonth, startOrder, endOrder) {
        const daysInMonth = this.getDaysBetween(startMonth, endMonth);

        if(startOrder >= startMonth && endOrder <= endMonth)
            return ((this.getDaysBetween(startOrder, endOrder) / daysInMonth) * 100);

        if(startOrder >= startMonth && startOrder <= endMonth && endOrder > endMonth)
            return ((this.getDaysBetween(endMonth, startMonth) / daysInMonth) * 100);

        if(endOrder >= startMonth && endOrder <= endMonth && startOrder < startMonth)
            return ((this.getDaysBetween(endOrder, startMonth) / daysInMonth) * 100);

        if(startOrder < startMonth && endOrder > endMonth)
            return 1;

        return 0;
    }
}

module.exports = new CarsBookingService();