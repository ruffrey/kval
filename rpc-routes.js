'use strict';
var debug = require('debug')('kval-db-rpc');
var encryption = require('./lib/encryption');

module.exports = function routeGenerator(password, con) {
    function res(data, next) {
        data = JSON.stringify(data);
        if (!password) { next(null, data); }
        debug('encrypting outgoing message', data);
        encryption.encrypt(data, password, next);
    }
    /**
     * If applicable, decrypt the entire data buffer.
     */
    function route(func) {
        if (!password) { return func; }
        return function decryptWrapper(data, next) {
            debug('decrypting incoming message length', data.length)
            encryption.decrypt(data, password, function (err, text) {
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
        }),
        // Authentication handshake route, called 2x
        _shake: route(function shake1(data, next) {
            if (typeof data !== 'object') { return next(new Error('Invalid shake')); }
            var isSecondShake = con.clientToken && con.dbToken && data.signedKey;
            if (!con.clientToken && !data.clientToken) {
                return callback(new Error('Missing client auth credential token'));
            }
            if (!isSecondShake) {
                data.dbToken = encryption.getToken();
                con.clientToken = data.clientToken;
                con.dbToken = data.dbToken;
                debug('handshake 1', data);
                return res(data, next);
            }
            if (!data.signedKey || !con.dbToken) {
                return next(new Error('Missing signing credentials'));
            }
            debug('handshake 2', data);
            encryption.signToken(con.clientToken, con.dbToken, function (err, signedKey) {
                if (err) { return next(err); }
                if (signedKey !== data.signedKey) {
                    return next('Failed validation of key signature');
                }
                con.signedKey = signedKey;
                res({ ok: true }, next);
            });
        })
    };
};
