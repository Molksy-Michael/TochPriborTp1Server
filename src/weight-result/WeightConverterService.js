'use strict';

const dgram = require('dgram'),
    serverUdp = dgram.createSocket('udp4'),
    boom = require('@hapi/boom'),
    moment = require('moment'),
    {isString, isInteger, isEmpty, isEqual, isNull, get, set} = require('lodash'),
    WeightResultModel = require('./WeightResultModel'),
    ScalesModel = require('../scales/ScaleModel');

const request = [1, 3, 0, 16, 0, 14, 197, 203];
const message = new Buffer(new Uint8Array(request));

const requestMass = [1, 3, 0, 44, 0, 16, 133, 207];
const messageMass = new Buffer(new Uint8Array(requestMass));

const requestAxis = [1, 3, 0, 194, 0, 52, 229, 225];
const messageAxis = new Buffer(new Uint8Array(requestAxis));

const requestCount = [1, 3, 0, 14, 0, 2, 165, 200];
const messageCount = new Buffer(new Uint8Array(requestCount));

var server, port, resultMass, formattedAddress, formattedNumber = null;

var weightQueue = {};

serverUdp.on('error', (err) => {
    console.log(`UDP server error:\n${err.stack}`);
    // serverUdp.close();
});

serverUdp.on('message', async (msg, rinfo) => {
    console.log(`UDP server got: from [${rinfo.address}:${rinfo.port}]`);
    let isPing = false;
    server = rinfo.address;
    port = rinfo.port;

    if (!(isEmpty(msg)) && (msg.length === 2)) {
        // console.log('Ping request');
        isPing = true;
        formattedNumber = WeightConverterService.convertNumber(msg);

        if (isEqual(get(weightQueue, formattedNumber, null) || null, null)) {
            weightQueue[formattedNumber] = {
                host: server,
                port: port,
                scaleId: null,
                count: 0,
                recordsLeft: 0,
                currentState: {
                    massRequest: true,
                    axisRequest: false,
                    axisReady: false,
                    countRequest: false,
                    mass: {},
                    axis: {}
                }
            };
        } else {
            weightQueue[formattedNumber].host = server;
            weightQueue[formattedNumber].port = port;
        }
        try {
            if (isEmpty(get(weightQueue[formattedNumber], 'scaleId'))) {
                const scale = await ScalesModel.getByNumber(isInteger(formattedNumber) ? formattedNumber.toString() : formattedNumber);

                if (!isEmpty(scale)) {
                    set(weightQueue[formattedNumber], 'scaleId', get(scale, 'id'));
                }
            }
            let count = await WeightResultModel.getMaxMySqlId(get(weightQueue[formattedNumber], 'scaleId'));
            weightQueue[formattedNumber].count = (count || 0) > 0 ? count + 1 : count;
        } catch (error) {
            console.error(`An error occurred during fetching of business information for scale number:[${formattedNumber}]`, error);
        }
        console.log(`Ping from weight #[${formattedNumber}]: [${JSON.stringify(weightQueue[formattedNumber])}]`);
        // if (get(weightQueue[formattedNumber], 'currentState.massRequest', false)) {
        //     WeightConverterService.requestMass(server, port);
        // }
        // WeightConverterService.requestMass(server, port);
        // WeightConverterService.requestArchiveRecord(server, port);
        // WeightConverterService.requestArchiveCount(server, port);
    } else {
        for (let wQ in weightQueue) {
            if (isEqual(weightQueue[wQ].host, server) && (weightQueue[wQ].port, port)) {
                formattedNumber = parseInt(wQ);
                // WeightConverterService.requestMass(server, port);
            }
        }
    }

    if (!isPing) {
        console.log(`Not ping response. Length:[${msg.length}], Number:[${formattedNumber}]`);
        try {
            if (!isEmpty(msg) && !isNull(formattedNumber)) {
                //Mass
                if (isEqual(msg.length, 39)) {
                    resultMass = WeightConverterService.parseResponseMass(msg, formattedNumber);
                    if (get(weightQueue[formattedNumber], 'currentState.massRequest', false)) {
                        if (get(weightQueue[formattedNumber], 'currentState.axisReady', false)) {
                            WeightConverterService.requestAxis(server, port);
                        }
                        // else {
                        //     WeightConverterService.requestMass(server, port);
                        // }
                    }
                }
                //Axis
                if (isEqual(msg.length, 111)) {
                    WeightConverterService.parseResponseAxis(msg, formattedNumber);
                    // if (get(weightQueue[formattedNumber], 'currentState.massRequest', false)) {
                    //     WeightConverterService.requestMass(server, port);
                    // }
                }
                //Count of records in TP-1 archive
                if (isEqual(msg.length, 11)) {
                    let recordsCount = WeightConverterService.parseArchiveCountResponse(msg, formattedNumber);
                    console.log(`TP1 count:[${recordsCount}], DB count:${get(weightQueue[formattedNumber], 'count')}`)
                    if (recordsCount > get(weightQueue[formattedNumber], 'count')) {
                        weightQueue[formattedNumber].recordsLeft = recordsCount - get(weightQueue[formattedNumber], 'count');
                        WeightConverterService.requestArchiveRecord(get(weightQueue[formattedNumber], 'host'),
                            get(weightQueue[formattedNumber], 'port'))
                    } else {
                        WeightConverterService.updateMassRequest(formattedNumber, true);
                    }
                }
                //Records from archive
                if (isEqual(msg.length, 35)) {
                    let record = WeightConverterService.parseArchiveRecordResponse(msg, formattedNumber);

                    try {
                        await WeightResultModel.createOne(record);
                        weightQueue[formattedNumber].recordsLeft = weightQueue[formattedNumber].recordsLeft - 1;
                        if (weightQueue[formattedNumber].recordsLeft > 0) {
                            WeightConverterService.requestArchiveRecord(get(weightQueue[formattedNumber], 'host'),
                                get(weightQueue[formattedNumber], 'port'));
                        } else {
                            WeightConverterService.updateMassRequest(formattedNumber, true);
                        }
                    } catch (error) {
                        console.error(``, error)
                    }
                }
                console.log(`Current mass state: ${JSON.stringify(weightQueue[formattedNumber])}`);
                if (isEqual(msg.length, 50)) {
                    let convert = (data) => isEqual(get(data, 'length', 0), 1) ? '0'.concat(data) : data;
                    let row = '';
                    for (let i = 0; i < msg.length; i++) {
                        row = row.concat(convert(msg[i]), ' ');
                    }
                    console.log(`Mixed respond: [${msg}]`);
                }
            }
        } catch (error) {
            console.error(error);
        }
        // try{
        //     if (!isEmpty(msg) && !isNull(formattedNumber)) {
        //         WeightConverterService.parseArchiveRecordResponse(msg, formattedNumber);
        //     }
        // } catch(error) {
        //     console.error(error);
        // }
    }

    formattedNumber = null;
});

serverUdp.on('listening', () => {
    const address = serverUdp.address();
    console.log(`UDP server listening on [${address.address}:${address.port}]`);
});

var WeightConverterService = {
    initUpd: (port) => {
        port = 2000;//process.env.UDP_PORT || 2000;
        serverUdp.bind(port);
    },

    getCurrentMass: () => {
        WeightConverterService.requestMass(server, port);
        return resultMass
    },

    getCurrentState: (weightNumber) => {
        if (isInteger(parseInt(weightNumber))) {
            return get(weightQueue[parseInt(weightNumber)], 'currentState', null);
        } else {
            throw boom.badData(`There is no active scale with number: [${weightNumber}]`);
        }
    },

    getArchiveData: (weightNumber) => {
        if (!isEmpty(weightNumber)) {
            let scale = weightQueue[weightNumber];
            WeightConverterService.requestArchiveRecord(get(scale, 'host'), get(scale, 'port'));
        }
    },

    getWeihgQueue: () => weightQueue,

    parseResponse: (message) => {
        let currentNumber, totalCount, tare, mass, number,
            month, day, minutes, hours, seconds, year, date;

        console.log(`Message length: ${message.length}`);

        if (!isEmpty(message) && message.length >= 33) {
            currentNumber = message[5].toString(16) + message[6].toString(16);
            totalCount = message[3].toString(16) + message[4].toString(16);
            tare = message[19].toString(16) + message[20].toString(16) + message[21].toString(16) + message[22].toString(16);
            mass = message[15].toString(16) + message[16].toString(16) + message[17].toString(16) + message[18].toString(16);
            number = message[23].toString(16) + message[24].toString(16) + message[25].toString(16) + message[26].toString(16);
            month = message[7].toString(16);
            day = message[8].toString(16);
            minutes = message[9].toString(16);
            hours = message[10].toString(16);
            seconds = message[13].toString(16);
            year = message[14].toString(16);
            date = message[7].toString(16) + message[8].toString(16) + message[9].toString(16) + message[10].toString(16);

            totalCount = parseInt(parseInt(totalCount, 16).toString(10));
            currentNumber = parseInt(parseInt(currentNumber, 16).toString(10)) + 1;

            mass = parseInt(parseInt(mass, 16).toString(10));
            tare = parseInt(parseInt(tare, 16).toString(10));
            number = parseInt(parseInt(number, 16).toString(10));

            month = parseInt(parseInt(month, 16).toString(10));
            day = parseInt(parseInt(day, 16).toString(10));
            minutes = parseInt(parseInt(minutes, 16).toString(10));
            hours = parseInt(parseInt(hours, 16).toString(10));
            seconds = parseInt(parseInt(seconds, 16).toString(10));
            year = parseInt(parseInt(year, 16).toString(10));
            date = parseInt(parseInt(date, 16).toString(10));

            let line = '';

            for (var i = 0; i < message.length; i++) {
                line += parseInt(parseInt(message[i].toString(16), 16).toString(10)) + ' ';
            }
            console.log(`Pre-parsed line: [${line}]`);

            return {
                totalCount: totalCount,
                id: currentNumber,
                carNumber: number,
                mass: mass,
                tare: tare,
                date: date,
                year: year,
                month: month,
                day: day,
                hours: hours,
                minutes: minutes,
                seconds: seconds
            }
                ;
        } else {
            return null;
        }
    },

    parseResponseMass: (message, weightNumber) => {
        // console.log(`Not ping parse response length: [${message.length}]`);
        if (!isEmpty(message) && (message.length == 39)) {
            // let mass = message[7].toString(16) + message[8].toString(16) + message[9].toString(16) + message[10].toString(16);
            // mass = parseInt(parseInt(mass, 16).toString(10));
            // let pl1, pl2;
            // pl1 = message[11].toString(16) + message[12].toString(16) + message[13].toString(16) + message[14].toString(16);
            // pl1 = parseInt(parseInt(pl1, 16).toString(10));
            let convert = (data) => isEqual(get(data, 'length', 0), 1) ? '0'.concat(data) : data;
            let mass = convert(message[7].toString(16)) + convert(message[8].toString(16)) + convert(message[9].toString(16)) + convert(message[10].toString(16));
            mass = parseInt(mass, 16);
            let pl1, pl2;
            pl1 = convert(message[11].toString(16)) + convert(message[12].toString(16)) + convert(message[13].toString(16)) + convert(message[14].toString(16));
            pl1 = parseInt(pl1, 16);

            if (mass >= 0) {
                pl2 = mass - pl1;
            }

            // console.log(`Axis flag: [${parseInt(parseInt(message[6].toString(16), 16).toString(10))}], [${parseInt(message[6].toString(16), 16).toString(10).length}]`);
            if (isEqual(parseInt(message[6].toString(16), 16).toString(10).length, 2)) {
                set(weightQueue[weightNumber], 'currentState.axisReady', true);
            } else {
                set(weightQueue[weightNumber], 'currentState.axisReady', false);
                set(weightQueue[weightNumber], 'currentState.axis', {});
            }
            set(weightQueue[weightNumber], 'currentState.mass', {mass: mass, pl1: pl1, pl2: pl2});
            console.log(`Temporary mass state: [${{mass: mass, pl1: pl1, pl2: pl2}}]`);
            return get(weightQueue[weightNumber], 'currentState.mass', {});
        } else {
            return {};
        }
    },

    parseResponseAxis: (message, weightNumber) => {
        if (!isEmpty(message) && (message.length > 2)) {
            let row = '';
            for (let i = 0; i < message.length; i++) {
                row = row.concat(message[i], ' ');
            }
            console.log(`Axis respond: [${row}]`);
            //start 15
            let result = [];

            for (let i = 0; i < 12; i++) {
                let tmp, shift;
                shift = i > 0 ? i * 4 + 11 : 11;
                tmp = message[shift].toString(16).concat(message[shift + 1].toString(16), message[shift + 2].toString(16), message[shift + 3].toString(16));
                tmp = parseInt(parseInt(tmp, 16).toString(10));
                result.push(tmp);
            }
            set(weightQueue[weightNumber], 'currentState.axis', result);
            return result;
        } else {
            set(weightQueue[weightNumber], 'currentState.axis', {});
            return null;
        }
    },

    parseArchiveCountResponse: (message, weightNumber) => {
        let row = '';
        let convert = (data) => isEqual(get(data, 'length', 0), 1) ? '0'.concat(data) : data;
        for (let i = 0; i < message.length; i++) {
            row = row.concat(convert(message[i]), ' ');
        }
        console.log(`Archive count respond: [${row}]`);

        return parseInt(convert(message[3].toString(16)) + convert(message[4].toString(16)), 16);
    },

    parseArchiveRecordResponse: (message, weightNumber) => {
        if (!isEmpty(message) && (message.length > 2)) {
            let convert = (data) => isEqual(get(data, 'length', 0), 1) ? '0'.concat(data) : data;
            let currentNumber = convert(message[5].toString(16)) + convert(message[6].toString(16)),
                totalCount = convert(message[3].toString(16)) + convert(message[4].toString(16)),
                mass = convert(message[15].toString(16)) + convert(message[16].toString(16)) + convert(message[17].toString(16)) + convert(message[18].toString(16)),
                tare = convert(message[19].toString(16)) + convert(message[20].toString(16)) + convert(message[21].toString(16)) + convert(message[22].toString(16)),
                number = convert(message[23].toString(16)) + convert(message[24].toString(16)) + convert(message[25].toString(16)) + convert(message[26].toString(16)),
                month = convert(message[7].toString(16)),
                day = convert(message[8].toString(16)),
                minutes = convert(message[9].toString(16)),
                hours = convert(message[10].toString(16)),
                seconds = convert(message[13].toString(16)),
                year = convert(message[14].toString(16)),
                date = convert(message[7].toString(16)) + convert(message[8].toString(16)) + convert(message[9].toString(16)) + convert(message[10].toString(16));

            currentNumber = parseInt(currentNumber, 16);
            totalCount = parseInt(totalCount, 16);
            mass = parseInt(mass, 16);
            tare = parseInt(tare, 16);
            date = parseInt(date, 16);

            year = parseInt(year, 16);
            month = parseInt(month, 16);
            day = parseInt(day, 16);
            hours = parseInt(hours, 16);
            minutes = parseInt(minutes, 16);
            seconds = parseInt(seconds, 16);

            console.log(`Current:[${currentNumber}], count:[${totalCount}], mass:[${mass}]`);
            console.log(`Year:[${year}], Month:[${month}], Day:[${day}], Hour:[${hours}], minutes:[${minutes}], seconds:[${seconds}]`);

            return {
                weight: mass,
                dateIn: moment(`20${year}-${convert(month)}-${convert(day)}`, 'YYYY-MM-DD').add(5, 'hours').format('YYYY-MM-DD'),
                timeIn: `${convert(hours)}:${convert(minutes)}:${convert(seconds)}`,
                id: currentNumber,
                scaleId: weightQueue[weightNumber].scaleId
            }
        }
    },

    requestArchiveRecord: (host, port) => {
        serverUdp.send(message, 0, message.length, port, host, function (err, bytes) {
            try {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`Bytes for archive record request sent to: [${host}:${port}]: ${bytes}`);
                }
            } catch (error) {
                console.error(`Error after sending: ${error}`);
            }
        });
    },

    requestArchiveCount: (host, port, wnum) => {
        if (isInteger(wnum)) {
            host = get(weightQueue[wnum], 'host') || '0.0.0.0';
            port = get(weightQueue[wnum], 'port') || '0000';
        }
        try {
            serverUdp.send(messageCount, 0, messageCount.length, port, host, function (err, bytes) {
                try {
                    if (err) {
                        console.error(err);
                    } else {
                        // set(weightQueue[wnum], 'currentState.countRequest', true);
                        console.log(`Bytes for archive records count request sent to: [${host}:${port}]: ${bytes}`);
                    }
                } catch (error) {
                    console.error(`Error after sending: ${error}`);
                }
            });
        } catch (error) {
            console.error('Error during request sending', error)
        }
    },

    requestMass: (host, port) => {
        serverUdp.send(messageMass, 0, messageMass.length, port, host, function (err, bytes) {
            try {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`Bytes for mass request sent to: [${host}:${port}]: ${bytes}`);
                }
            } catch (error) {
                console.error(`Error after sending: ${error}`);
            }
        });
    },

    requestAxis: (host, port) => {
        serverUdp.send(messageAxis, 0, messageAxis.length, port, host, function (err, bytes) {
            try {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`Bytes for axis request sent to: [${host}:${port}]: ${bytes}`);
                }
            } catch (error) {
                console.error(`Error after sending: ${error}`);
            }
        });
    },

    convertNumber: (message) => parseInt(parseInt((message[1].toString(16) + message[0].toString(16)), 16).toString(10)),
    convertNumberTest: (message) => (message[0].toString(16) + message[1].toString(16) + message[2].toString(16) + message[3].toString(16)
        + message[4].toString(16) + message[5].toString(16) + message[6].toString(16) + message[7].toString(16)),

    updateMassRequest: (number, action) => {
        if (!isEmpty(weightQueue[number] || null)) {
            set(weightQueue[number], 'currentState.massRequest', action);
        }
    }

};

module.exports = WeightConverterService;