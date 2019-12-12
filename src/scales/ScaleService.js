'use strict';

const ScaleModel = require('./ScaleModel'),
    {isEmpty, get} = require('lodash'),
    {isUUID} = require('validator'),
    boom = require('@hapi/boom'),
    WeightConverterService = require('../weight-result/WeightConverterService');

const ScaleService = {
    getTsState: async(scaleId) => {
        if (isEmpty(scaleId)) {
            throw boom.badData('Empty request ID');
        } else if (!isUUID(scaleId)) {
            throw boom.badData(`Provided ID: [${scaleId}] is not valid UUID`);
        }

        try {
            let scale = await ScaleModel.getOne(scaleId);

            if (isEmpty(scale)) {
                throw boom.badData(`Весы с ID: [${scaleId}] не найдены`);
            } else {
                return WeightConverterService.getCurrentState(get(scale, 'serialNumber', null) || null);
            }
        } catch (error) {
            console.error(error);
            if (error.isBoom) {
                throw error;
            } else {
                throw boom.badData(`Ошибка при обработке текущего состояния весов. UUID:[${scaleId}]`);
            }
        }

    }
};

module.exports = ScaleService;