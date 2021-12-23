const db = require("../db");

class CarsBookingService
{
    async getFreeCars(startDate, endDate) {
        const start = this.dateFromString(startDate);
        const end = this.dateFromString(endDate);

        if(!this.isValidDateInterval(start, end))
            throw new Error("End date should be greater than start date");

        if(!this.isBusinessDate(start) || !this.isBusinessDate(end))
            throw new Error("You can order a car only in business dates");

        if(!this.isValidOrderRange(start, end))
            throw new Error("You can order a car only for 30 days");

        const result = await db.query("select * from get_free_cars($1, $2)", [startDate, endDate]);
        return result;
    }

    async orderCar(carId, startDate, endDate) {

    }

    isValidDateInterval(startDate, endDate) {
        return (endDate >= startDate);
    }

    isValidOrderRange(startDate, endDate) {
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        return (((endDate - startDate) / oneDayInMilliseconds) <= 30);
    }

    isBusinessDate(date) {
        return (date.getDay() >= 1 && date.getDay() <= 5);
    }

    dateFromString(dateString) {
        return new Date(Date.parse(dateString));
    }
}

module.exports = new CarsBookingService();