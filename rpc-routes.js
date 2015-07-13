'use strict';
var debug = require('debug')('kval-routes');
var encryption = require('./lib/encryption');
var algorithm = 'aes-256-ctr';

module.exports = function routeGenerator(password) {
    function res(data, next) {
        if (!password) { next(null, JSON.stringify(data)); }
        encryption.encrypt(data, algorithm, password, next);
    }
    /**
     * If applicable, decrypt the entire data buffer.
     */
    function route(func) {
        if (!password) { return func; }
        return function decryptWrapper(data, next) {
            encryption.decrypt(data, algorithm, password, function (err, text) {
                if (err) { return next(err); }
                try {
                    text = JSON.parse(text);
                } catch (ignored) { }
                func(text, next);
            });
        };
    }

    // These are the actual routes
    return {
        ping: route(function pingRoute(data, next) {
            data = data || '';
            if (!data) { return next(null, data); }
            var shortenedMessage = data.substring(0, 256);
            debug('ping', shortenedMessage);
            // prevent giant pings
            res(shortenedMessage, next);
        })

    };
};
