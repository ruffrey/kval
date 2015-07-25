'use strict';
var debug = require('debug')('kval-db-rpc');
var encryption = require('../encryption');

module.exports = function routeGenerator(password, con, env, model) {
    function res(data, next) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        if (!password || !data) { return next(null, data); }
        debug('encrypting outgoing message', data);
        encryption.encrypt(data, password, next);
    }
    /**
     * If applicable, decrypt the data and parse it into JSON.
     * When theh db has a pre-shared password, and auth is required on the route,
     * return a non-encrypted message to the client that indicates it failed
     * authentication or needs to authenticate.
     */
    function route(func, noAuthRequired) {
        if (!password) {
            return function jsonParseWrapper(stringifiedObject, next) {
                var objectString;
                try {
                    objectString = JSON.parse(stringifiedObject);
                } catch (ignored) {
                    // failed to parse, it may just be a string
                    objectString = stringifiedObject;
                }
                func(objectString, next);
            };
        }
        return function decryptWrapper(data, next) {
            // Auth check
            if (!noAuthRequired && !con.signedKey) {
                return next({ error: 'Unauthenticated request.', status: 401 });
            }
            if (!data) {
                return func(data, next);
            }
            debug('decrypting incoming message length', (data || '').length)
            encryption.decrypt(data, password, function (err, stringifiedObject) {
                debug('decrypted length is', (data || '').length);
                if (err) { return next(err); }
                var objectString;
                try {
                    objectString = JSON.parse(stringifiedObject);
                } catch (ignored) {
                    // failed to parse, it may just be a string
                    objectString = stringifiedObject;
                }
                func(objectString, next);
            });
        };
    }

    // These are the actual routes
    return {
        ping: route(function pingRoute(data, next) {
            data = data || '';
            // if (!data) { return next(null, data); }
            var shortenedMessage = data.substring(0, 256);
            debug('got ping', shortenedMessage);
            // prevent giant pings
            res(shortenedMessage, next);
        }),
        /**
         * Put data, overwriting existing data at the specified key.
         *
         * { model: '', id: '932ksblkas', data: { any: "json" }, indexes: [], uniques: [] }
         * If `id` is not specified, one will be generated using the default `uid`
         * generator.
         */
        put: route(function putRoute(body, next) {
            debug('got put', body);
            if (!body.model) {
                var err = new Error('Missing model');
                err.status = 400;
                return next(err);
            }
            if (typeof body.data === undefined || body.data === null) {
                var err = new Error('Db: issing data');
                err.status = 400;
                return next(err);
            }
            if (body.indexes && !(body.indexes instanceof Array)) {
                var err = new Error('Db: indexes should be an array');
                err.status = 400;
                return next(err);
            }
            if (body.uniques && !(body.uniques instanceof Array)) {
                var err = new Error('Db: uniques should be an array');
                err.status = 400;
                return next(err);
            }

            // id generation is automatic
            if (!body.id) {
                body.id = encryption.uid();
            }

            var store = model(body.model).dbi;
            var indexStore = model(body.model).indexDbi;
            var indexes = body.indexes || [];
            var uniques = body.uniques || [];
            var id = body.id;
            var txn = env.beginTxn();
            var oldRecord = txn.getString(store, id);
            txn.putString(store, id, JSON.stringify(body.data));

            // Check for any uniques, ensuring that if they exist,
            // the `id` is the same, indicating this is an update rather
            // than a collision.
            var uniqueFailed = null;
            var val;
            var exists;
            var i;
            if (uniques.length) {
                for (i = 0; i < uniques.length; i++) {
                    val = uniques[i];
                    exists = txn.getString(indexStore, val);
                    if (exists && exists !== id) {
                        uniqueFailed = new Error('Value already exists in db: ' + val.split(':')[0]);
                        uniqueFailed.status = 400;
                        uniqueFailed.prop = val;
                        uniqueFailed.id = exists;
                        break;
                    }
                    debug('put unique index for', id, val);
                    txn.putString(indexStore, val, id);
                }
            }
            if (uniqueFailed) {
                debug('put unique failed', uniqueFailed);
                return next(uniqueFailed);
            }

            // Add any normal indexes.
            indexes.forEach(function (val) {
                debug('put index for', id, val);
                txn.putString(indexStore, val, id);
            });
            txn.commit();
            debug('put committed', id);
            res(body.data, next);

            // After the fact, if an existing record was present, clean
            // up the previous keys
            if (oldRecord) {
                debug('after put, cleanup any indexes', id, oldRecord);

                try {
                    oldRecord = JSON.parse(oldRecord);
                } catch (ignore) {
                    debug('after put - failure - invalid oldRecord', id);
                    return;
                }

                txt = env.beginTxn();
            }
        }),
        /**
         * Get data by id. `{ model: '', id: '' }`
         * Responds with `{ custom: 'stored', properties: 'here' }`
         */
        get: route(function getRoute(body, next) {
            debug('got get', body);
            if (!body.model) {
                var err = new Error('Db: missing model');
                err.status = 400;
                return next(err);
            }
            if (!body.id) {
                var err = new Error('Db: missing id');
                err.status = 400;
                return next(err);
            }

            var txn = env.beginTxn();
            var store = model(body.model).dbi;
            var objectStoredString = txn.getString(store, body.id);
            txn.abort();
            res(objectStoredString, next);
        }),
        /**
         * Get data by the index. `{ model: '', indexes: ['someprop:Billy Bob'], params: { limit: 1 } }`
         * Responds with `{ custom: 'stored', properties: 'here' }`
         */
        getByIndex: route(function getByIndexRoute(body, next) {
            debug('got getByIndex', body);
            if (!body.model) {
                var err = new Error('Missing model');
                err.status = 400;
                return next(err);
            }
            if (!(body.indexes instanceof Array)) {
                var err = new Error('indexes should be an array');
                err.status = 400;
                return next(err);
            }
            if (!body.indexes.length) {
                var err = new Error('indexes list is missing');
                err.status = 400;
                return next(err);
            }
            if (body.params && typeof params !== 'object') {
                var err = new Error('params should be an object');
                err.status = 400;
                return next(err);
            }
            var txn = env.beginTxn();
            var indexStore = model(body.model).indexDbi;
            var realIds = [];
            var _id;
            for (var i = 0; i < body.indexes.length; i++) {
                _id = txn.getString(indexStore, body.indexes[i]);
                if (_id) { realIds.push(_id); }
            }
            var objectStoredString;
            var store = model(body.model).dbi;
            var objectStringList = [];
            for (var i = 0; i < realIds.length; i++) {
                objectStoredString = txn.getString(store, realIds[i]);
                if (objectStoredString) {
                    try {
                        objectStringList.push(JSON.parse(objectStoredString));
                    } catch (ex) {
                        debug('invalid objectStoredString', objectStoredString, ex.message, ex.stack);
                    }
                }
            }
            res(objectStringList, next);
        }),
        /**
         * Delete data by id. { model: '', id: '', indexes: [] }
         */
        del: route(function delRoute(body, next) {
            debug('got del', body);
            if (!body.model) {
                var err = new Error('Missing model');
                err.status = 400;
                return next(err);
            }
            if (!body.id) {
                var err = new Error('Missing id');
                err.status = 400;
                return next(err);
            }
            if (body.indexes && !(body.indexes instanceof Array)) {
                var err = new Error('indexes should be an array');
                err.status = 400;
                return next(err);
            }
            var txn = env.beginTxn();
            var store = model(body.model).dbi;
            txn.del(store, body.id);
            if (body.indexes) {
                var indexStore = model(body.model).indexDbi;
                for (var i = 0; i < body.indexes.length; i++) {
                    txn.del(indexStore, body.indexes[i]);
                }
            }
            txn.commit();
            res({ ok: true }, next);
        }),
        /**
         * Authentication handshake route, called 2x for two different
         * stages of back-and-forth authentication.
         *
         * All requests are encrypted with the pre-shared key.
         *
         * On subsequent client requests, the session `signedKey` is always
         * required (may not be necessary since socket is the same?)
         *
         * (? should encrypt with `signedKey` instead of pre-shared key ?)
         *
         * 1. client -> {clientToken} -> dbms
         *      server checks
         * 2. client <- {clientToken, dbToken} <- dbms
         *      client checks that `clientToken` matches
         * 3. client -> {clientToken, dbToken, signedKey} -> dbms
         * 4. client <- {signedKey} <- dbms
         */
        _shake: route(function _shakeRoute(data, next) {
            if (typeof data !== 'object') {
                var err = new Error('Invalid shake - password incorrect');
                err.status = 401;
                return next(err);
            }
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
                res({ signedKey: con.signedKey }, next);
            });
        }, true)
    };
};
