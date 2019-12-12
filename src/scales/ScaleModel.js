const {Scale} = require('../models/models'),
    boom = require('@hapi/boom'),
    lodash = require('lodash');


const ScaleModel = {
    getByNumber: async (number) => {
        if (lodash.isEmpty(number)) {
            throw boom.badData('Scale number is required');
        }

        try {
            return await Scale.findOne({where: {serialNumber: number}});
        } catch (error) {
            console.error(error);
            let err = boom.badRequest('Fetching error', error);
            err.output.payload.details = err.data;
            throw err;
        }
    }
};

module.exports = ScaleModel;