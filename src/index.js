const Hapi = require('@hapi/hapi'),
    WCService = require('./weight-result/WeightConverterService'),
    schedulers = require('./schedulers');


const server = new Hapi.Server({
    host: '0.0.0.0',
    port: 8009,
    routes: {
        cors: {
            origin: ['*'],
            credentials: true
        }
    }
});

const routes = require('./routes');
server.route(routes);

let start = async() => {
    try {
        const corsHeaders = function (request, h) {

            const response = request.response;
            if (response.isBoom) {
                return h.continue;
            }

            response.headers["Access-Control-Allow-Origin"] = "*";

            return h.continue;
        };

        server.ext('onPreResponse', corsHeaders);

        await server.start();
        console.log('Server running at: ', server.info.uri);

        try {
            WCService.initUpd(2000);
        } catch (error) {
            console.error(error);
        }

        schedulers.LoadReasultsFromTP();
        schedulers.LoadCurrentMassFromTP();
    } catch(error) {
        console.log(error);
        process.exit(1);
    }
};

start();