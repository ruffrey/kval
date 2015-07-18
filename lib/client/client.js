'use strict';
var dnode = require('dnode');
var net = require('net');
var Model = require('./Model');
var debug = require('debug')('kval-client');
var encryption = require('../encryption');
var rpcEncryptWrapper = require('./rpc-encrypt-wrapper');
var async = require('async');

function Client() {
    var self = this;
    self.__id = encryption.uid();
    var _clients = [];
    self._poolSize = 1;
    function getClient() {
        // index max and min
        var max = _clients.length - 1;
        var min = 0;
        var r = Math.random() * (max - min) + min;
        var c = _clients[r];
        // console.log('----\ngetClient', c);
        return c;
    }
    self.datastoreMethods = ['ping', '_shake', 'get', 'put', 'del', 'find'];
    self.datastoreMethods.forEach(function (methodName) {
        self[methodName] = function (data, cb) {
            getClient()[methodName](data, cb);
        };
    });
    var models = {};

    /**
     * Instantiate and return an object Model store.
     */
    self.model = function (name, schema) {
        // when already initialized
        if (models[name]) {
            return models[name];
        }
        models[name] = Model.compile(name, self, schema);
        return models[name];
    };

    self.connect = function (netOptions, connectionCb) {
        debug('connecting to', netOptions.host, netOptions.port);
        if (netOptions.password) {
            debug('init with encryption');
        } else {
            debug('init with no encryption');
        }

        var _client;

        // Make a client for as many as were specified to be in the pool
        async.timesSeries(self._poolSize, function (n, clientCreationCb) {
            debug('creating rpc client', n);

            async.series([
                function doConnection(cb) {
                    function onConnectErr(err) {
                        debug('connect err', err.message, err.stack);
                        cb(err);
                    }

                    _client = dnode.connect(netOptions);
                    _client.signedKey;
                    _client.methods;
                    _client._net;
                    _client._conn;

                    _client.on('remote', function onConnectWithRemoteSetup(remote) {
                        debug('client connect remote setup', Object.keys(remote));
                        _client.methods = remote;
                        _client.removeListener('error', onConnectErr);
                        _clients.push(_client);
                        cb();
                    });
                    _client.once('error', onConnectErr);
                },
                function setupMethods(cb) {
                    // Bind the methods to the client instance, wrapping them in the encryption
                    // and decryption if applicable.
                    if (netOptions.password) {
                        Object.keys(_client.methods).forEach(rpcEncryptWrapper(_client, netOptions.password));
                    } else {
                        Object.keys(_client.methods).forEach(function (m) {
                            var originalMethod = _client.methods[m];
                            _client[m] = function (data, methodCallback) {
                                debug('plain send', m, data);
                                data = JSON.stringify(data);
                                originalMethod(data, function (err, resData) {
                                    if (resData) {
                                        try {
                                            resData = JSON.parse(resData);
                                        } catch (ignored) { }
                                    }
                                    methodCallback(err, resData);
                                });
                            }
                        });
                    }
                    cb();
                },
                function startHandshake(cb) {
                    debug('client made net connection');
                    // That's pretty much it, when no encryption is in use.
                    if (!netOptions.password) { return cb(); }

                    // Check authorization by generating a random token and ensuring
                    // it is decrypted with the password on the other end, then
                    // returned as the same token.
                    var clientToken = encryption.getToken();
                    debug('clientToken for handshake generated', clientToken);
                    async.waterfall([
                        function handshake1(handshakeCb) {
                            debug('client doing shake 1');
                            _client._shake({ clientToken: clientToken }, handshakeCb);
                        },
                        function processHandshake1(res1, handshakeCb) {
                            debug('handshake 1 client received response', res1);
                            if (typeof res1 !== 'object' || res1.clientToken !== clientToken || !res1.dbToken) {
                                debug('handshake 1 failed');
                                err = new Error('password failed; invalid auth response from db server');
                                err.status = 401;
                                return handshakeCb(err);
                            }
                            if (!res1.dbToken) {
                                err = new Error('invalid handshake response from db server - missing dbToken');
                                err.status = 500;
                                return handshakeCb(err);
                            }
                            handshakeCb(null, res1.dbToken);
                        },
                        function signDbToken(dbToken, handshakeCb) {
                            debug('signing dbToken', dbToken);
                            encryption.signToken(clientToken, dbToken, handshakeCb);
                        },
                        function handshake2(signedKey, handshakeCb) {
                            debug('created signedKey', signedKey.length, signedKey);
                            _client.signedKey = signedKey;
                            debug('client doing shake 2')
                            _client._shake({ signedKey: signedKey }, handshakeCb);
                        },
                        function processHandshake2(res2, handshakeCb) {
                            var err;
                            debug('handshake 2 client received response', res2);
                            var isAcceptable = typeof res2 === 'object';
                            if (!isAcceptable) {
                                err = new Error('password failed; malformed auth response on shake two with db server');
                                err.status = 500;
                                return handshakeCb(err);
                            }
                            var improperSigningToken = _client.signedKey !== res2.signedKey;
                            if (improperSigningToken) {
                                err = new Error('password failed; invalid auth signedKey on shake two with db server');
                                err.status = 401;
                                return handshakeCb(err);
                            }
                            debug('handshake complete');
                            handshakeCb();
                        }
                    ], cb);
                }
            ], clientCreationCb);
        }, function (err) {
            if (err) {
                debug('client creation error', err.message, err.stack);
                return connectionCb(err);
            }
            debug('client creation success', self.__id);
            connectionCb();
        });
    };
    self.disconnect = function (cb) {
        if (!_clients.length) { return cb(); }
        debug('disconnecting...', self.__id);
        var toKill = _clients.length;
        var killed = 0;
        _clients.forEach(function (_client) {
            _client.once('end', function () {
                debug('client disconnected successfully.', self.__id);
                killed++;
                if (killed === toKill) {
                    cb();
                }
            });
            _client.end();
        });
    };
}

module.exports = Client;
