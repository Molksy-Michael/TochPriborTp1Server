const Sequelize = require('sequelize'),
 appConfig = require('../config/appConfig');

const sequelize = new Sequelize(appConfig.database.database, appConfig.database.userName, appConfig.database.password, {
    host: appConfig.database.host,
    dialect: appConfig.database.dialect
});

/**
 * It will terminate the server if can't connect to database
 * @return {Promise<void>}
 */
async function checkDBConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

module.exports = {
    Sequelize,
    sequelize,
    checkDBConnection,
};