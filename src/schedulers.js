'use strict';

const
    schedule = require('node-schedule'),
    WeightConverterService = require('./weight-result/WeightConverterService'),
    {isEmpty} = require('lodash');

var SchedulerJobs = {
    LoadReasultsFromTP: () => {
        schedule.scheduleJob('7 */5 * * * *', ()=> {//every 5 minutes
            const queue = WeightConverterService.getWeihgQueue();

            if (Object.keys(queue).length > 0) {
                console.log(`There is ${Object.keys(queue).length} scales online to ask`);
                Object.keys(queue).map((k, i) => {
                    if (!isEmpty(k)) {
                        WeightConverterService.updateMassRequest(parseInt(k), false);
                        WeightConverterService.requestArchiveCount('', '', parseInt(k));
                    }
                })
            } else {
                console.log(`There are no scales online`)
            }
        });
    },

    LoadCurrentMassFromTP: () => {
        schedule.scheduleJob('*/5 * * * * *', ()=> {
            const queue = WeightConverterService.getWeihgQueue();
            if (Object.keys(queue).length > 0) {
                console.log(`There are ${Object.keys(queue).length} scales online to get mass`);
                Object.keys(queue).map((k, i) => {
                    if (!isEmpty(k)) {
                        WeightConverterService.requestMass(queue[parseInt(k)].host, queue[parseInt(k)].port);
                    }
                })
            } else {
                console.log(`There are no scales online`)
            }
        })
    }
};

module.exports = SchedulerJobs;