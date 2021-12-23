const dispatchErrors = (controller) => {
    return async (req, res) => {
        try {
            const result = await controller(req, res);
            res.send(result)
        } catch (e) {
            console.log(e.message);
            res.send({message: e.message});
        }
    }
}

module.exports = dispatchErrors;
