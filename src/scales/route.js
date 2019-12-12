const ScaleModel = require('./ScaleModel');

const modelName = 'scale';

module.exports = [
    {
        method: 'GET',
        path: `/${modelName}/{number}`,
        handler: async (request, h) => {
            try {
                return await ScaleModel.getByNumber(request.params.number);
            } catch (error) {
                throw error;
            }
        }
    }
];