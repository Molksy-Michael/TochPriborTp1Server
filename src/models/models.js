const {sequelize, Sequelize} =  require('../setup/sequelize');

const modules = [
    require('./Scale'),
    require('./WeightResult')
];

const models = {};

// Initialize models
modules.forEach((module) => {
    const model = module.init(sequelize, Sequelize);
    models[model.name] = model;
});

// Add associations
Object.values(models)
    .forEach((model) => {
        if (model.associate) {
            model.associate(models);
        }
    });

module.exports = models;
