var debug = require('debug')('kval-webapp');
var fs = require('fs');
var async = require('async');
var publicDir = __dirname + '/public';
var staticCache = {};
var path = require('path');
var http = require('http');
var connect = require('connect');
var router = require('connect-route');
var compression = require('compression');
var bodyParser = require('body-parser');
var static = require('serve-static');
var qs = require('qs');

function hasAuthApi(req, res, next) {
    if (!req.dbms.password) { return next(); }
    var auth = req.headers['kval-auth'] || req.query.auth;
    if (!auth) {
        res.statusCode = 401;
        res.json({ error: 'Missing auth' });
        return;
    }
    if (req.dbms.password !== auth) {
        res.statusCode = 401;
        res.json({ error: 'Invalid auth header' });
        return;
    }
    next();
}
function notFoundApi(req, res) {
    res.statusCode = 404;
    res.json({ error: 'Route not matched' });
}
function routes(router) {
    router.get('/', function (req, res, next) {
        res.json({ models: Object.keys(req.dbms.models) });
    });
    router.get('/*', notFoundApi);
    router.put('/*', notFoundApi);
    router.post('/*', notFoundApi);
    router.options('/*', notFoundApi);
    router.delete('/*', notFoundApi);
    router.patch('/*', notFoundApi);
}

module.exports = function AppServer(dbms) {
    var app = connect();
    app.use(compression());
    app.use(static(__dirname + '/public'));
    app.use(function (req, res, next) {
        req.dbms = dbms;
        res.json = function sendJson(data) {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(data));
        };
        debug(req.method, req.url);
        next();
    });
    app.use(function (req, res, next) {
        if (req._parsedUrl) {
            req.query = qs.parse(req._parsedUrl.query);
        } else {
            req.query = {};
        }
        next();
    });
    app.use(hasAuthApi);
    app.use(bodyParser.json());
    app.use('/api', router(routes));
    return http.createServer(app);
};
