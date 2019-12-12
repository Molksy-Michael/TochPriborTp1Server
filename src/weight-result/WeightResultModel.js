'use strict';

const {WeightResult} = require('../models/models'),
    boom = require('@hapi/boom'),
    validator = require('validator'),
    {isEmpty, isInteger, isArray, isEqual} = require('lodash');

const WeightResultModel = {
    getMaxMySqlId: async (scaleId) => {
        try {
            return await WeightResult.max('mySqlId', {where: {scaleId: scaleId}}) || 0
        } catch(error) {
            throw error;
        }
    },

    createOne: async (params) => {
        let errors = validate(params), record;

        if (errors.isValid) {
            record = {
                scaleId: params.scaleId,
                mass: params.weight,
                name: params.driver || null,
                carNumber: params.carNumber || null,
                mySqlId: params.id,
                date: params.dateIn,
                time: params.timeIn
            };
        } else {
            let err = boom.badData('Ошибка валидации', errors);
            err.output.payload.details = err.data;
            throw err;
        }

        try {
            return await WeightResult.create(record);
        } catch(error) {
            let err = boom.badData('Ошибка при создании записи', error);
            err.output.payload.details = err.data;
            throw err;
        }
    }
};

function validate(data){
    let errors = {
        weight: [],
        dateIn: [],
        timeIn: [],
        id: []
    };

    if (!isInteger(data.weight)) {
        errors.weight.push('Не верный формат массы');
    }
    if (isEmpty(data.dateIn)) {
        errors.dateIn.push('Не укаказана дата взвешивания');
    }
    if (isEmpty(data.timeIn)) {
        errors.timeIn.push('Не указано время взвешивания');
    }
    if (!isInteger(data.id)) {
        errors.id.push('Не указанидентификатор номера записи');
    }

    let isValid = true;
    for (let error in errors) {
        if (errors[error].length > 0) {
            isValid = false;
        } else {
            delete errors[error];
        }
    }

    errors.isValid = isValid;

    return errors;
}

module.exports = WeightResultModel;