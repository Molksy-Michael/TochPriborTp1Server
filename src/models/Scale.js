const Sequelize = require('sequelize');

const PortType = {
    UDP: 'udp',
    HTTP: 'http'
};

class Scale extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init({
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true
                },
                userId: {
                    type: DataTypes.UUID,
                    field: 'user_id'
                },
                ipAddress: {
                    type: DataTypes.STRING(50),
                    field: 'ip_address'
                },
                port: {
                    type: DataTypes.STRING(10),
                    field: 'port'
                },
                portType: {
                    type: DataTypes.ENUM,
                    values: Object.keys(PortType).map(pt => PortType[pt]),
                    defaultValue: PortType.HTTP,
                    field: 'port_type'
                },
                scaleName: {
                    type: DataTypes.STRING(50),
                    field: 'scales_name'
                },
                serialNumber: {
                    type: DataTypes.STRING(50),
                    field: 'serial_number'
                },
                description: {
                    type: DataTypes.STRING(80),
                    field: 'description'
                },
                scaleLocation: {
                    type: DataTypes.STRING(120),
                    field: 'scale_location'
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
                tableName: 'scales',
                sequelize
            })
    }
};

module.exports = Scale;


