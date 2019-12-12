'use strict';

const Sequelize = require('sequelize');

class WeightResult extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init({
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true
                },
                scaleId: {
                    type: DataTypes.UUID,
                    field: 'scale_id'
                },
                mass: {
                    type: DataTypes.INTEGER,
                    field: 'mass'
                },
                date: {
                    type: DataTypes.DATE,
                    field: 'date'
                },
                time: {
                    type: DataTypes.TIME,
                    field: 'time'
                },
                name: {
                    type: DataTypes.STRING(40),
                    field: 'name'
                },
                carNumber: {
                    type: DataTypes.STRING(20),
                    field: 'car_number'
                },
                mySqlId: {
                    type: DataTypes.INTEGER,
                    field: 'my_sql_id'
                },
                position: {
                    type: DataTypes.INTEGER,
                    field: 'position'
                },
                createdAt: {
                    type: DataTypes.DATE,
                    field: 'created_at'
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    field: 'updated_at'
                }
            },
            {
                tableName: 'weight_result',
                sequelize
            })
    }
};

module.exports = WeightResult