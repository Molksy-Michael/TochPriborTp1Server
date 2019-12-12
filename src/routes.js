var finder = require('fs-finder'),
    _ = require('lodash'),
    routes = [];

function loadRoutesData(routeStorage) {
    return _.flatten(finder.from("src/").findFiles("route.js").reduce(function (storage, file) {
        storage.push(require(file));
        return storage;
    }, routeStorage));
}
/**
 * @exports routes
 */
module.exports = loadRoutesData(routes);