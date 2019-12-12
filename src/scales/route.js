const ScaleService = require('./ScaleService');

const modelName = 'scale';

module.exports = [
    {
        method: 'GET',
        path: `/${modelName}/{scaleId}`,
        handler: async (request, h) => {
            try {
                return await ScaleService.getTsState(request.params.scaleId);
            } catch (error) {
                throw error;
            }
        }
    }
];