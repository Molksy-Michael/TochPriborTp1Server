module.exports = {
    database: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        userName: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        dialect: 'postgres',
        define: {
            underscored: true,
            freezeTableName:true
        }
    }
}