'use strict';

const {Scale} = require('../models/models'),
    boom = require('@hapi/boom'),
    {isUUID} = require('va'),
    lodash = require('lodash');


const ScaleModel = {
    getOne: async(id) => {
        if (!isUUID(id)) {
            throw boom.badData('Validation error', 'Не валидный ID весов');
        }

        try {
            return await Scale.findById(id);
        } catch (error) {
            console.error(error);
            let err = boom.badRequest('Fetching error', error);
            err.output.payload.details = err.data;
            throw err;
        }
    },

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