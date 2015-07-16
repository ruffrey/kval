'use strict';
var rpc = require('rpc-stream');
var net = require('net');
var Model = require('./Model');
var debug = require('debug')('kval-client');
var encryption = require('../encryption');

function Client() {
    var self = this;
    var _client = null;
    self._connection = null;
    self.datastoreMethods = ['ping', '_shake', 'get', 'put', 'del', 'find'];
    self.signedKey = '';
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

    self.connect = function (netOptions, callback) {
        debug('connecting...');
        if (netOptions.password) {
            debug('init with encryption');
        } else {
            debug('init with no encryption');
        }

        _client = rpc(null);

        // Make the net connection
        self._connection = net.connect(netOptions, function (err) {
            if (err) { debug('connect error', err.message, err.stack); }
            else { debug('connected.'); }
            if (err) { return callback(err); }
            if (!netOptions.password) { return callback(); }
            // Check authorization by generating a random token and ensuring
            // it is decrypted with the password on the other end, then
            // returned as the same token.
            var token = encryption.getToken();
            debug('clientToken generated', token);
            self._shake({ clientToken: token }, function (err, res1) {
                if (err) { return callback(err); }
                debug('handshake 1', res1);
                if (typeof res1 !== 'object' || res1.clientToken !== token || !res1.dbToken) {
                    debug('handshake 1 failed');
                    err = new Error('password failed; invalid auth response from db server');
                    err.status = 401;
                    return callback(err);
                }
                debug('signing dbToken', res1.dbToken);
                encryption.signToken(token, res1.dbToken, function (err, signedKey) {
                    if (err) { return callback(err); }
                    debug('got signedKey', signedKey.length, signedKey);
                    res1.signedKey = signedKey;
                    self._shake(res1, function (err, res2) {
                        if (err) { return callback(err); }
                        var isAcceptable = typeof res2 !== 'object' || res2.clientToken !== token || res1.signedKey !== res2.signedKey;
                        if (!isAcceptable) {
                            err = new Error('password failed; invalid auth response on shake two with db server');
                            err.status = 401;
                            return callback(err);
                        }
                        self.signedKey = res2.signedKey;
                        callback(null, self.signedKey);
                    });
                });
            });
        });

        // Additional configurations
        _client
            .pipe(self._connection)
            .pipe(_client);

        var methods = _client.wrap(self.datastoreMethods);
        // Bind the methods to the client instance, wrapping them in the encryption
        // and decryption if applicable.
        Object.keys(methods).forEach(function (m) {
            self[m] = function encryptWrappedClientCall(inputData, callback) {
                inputData = inputData || null;
                if (typeof inputData !== 'string') {
                    inputData = JSON.stringify(inputData);
                }
                debug(m + ' initial sending data length', inputData.length);
                if (netOptions.password && inputData) {
                    encryption.encrypt(inputData, netOptions.password, function (err, d) {
                        debug(m + ' post encryption data length', inputData.length);
                        inputData = d;
                        doIt();
                    });
                } else {
                    doIt();
                }
                function doIt() {
                    debug(m + ' sending now', inputData.length)
                    methods[m](inputData, function decryptWrappedClientCallback(err, receivedData) {
                        if (receivedData) {
                            debug(m + ' received data length', receivedData.length);
                        }
                        if (!err && netOptions.password && receivedData) {
                            debug(m + ' pre decryption data length', receivedData.length);
                            encryption.decrypt(receivedData, netOptions.password, function (err, text) {
                                if (err) { return callback(err); }
                                receivedData = text;
                                debug(m + ' post decryption data length', receivedData.length);
                                keepGoing();
                            });
                        } else {
                            keepGoing();
                        }
                        function keepGoing() {
                            if (err) { return callback(err); }
                            try {
                                receivedData = JSON.parse(receivedData);
                            } catch (ignored) { } // just a normal string

                            // Format for returning non-connection related errors.
                            // Construct an error from it.
                            if (receivedData && receivedData.error) {
                                err = new Error(receivedData.error);
                                err.status = receivedData.status; // optional
                                return callback(err);
                            }
                            callback(null, receivedData);
                        }
                    });
                }
            };
        });
        self.disconnect = function (cb) {
            debug('disconnecting...');
            _client.once('end', function () {
                debug('disconnected successfully.');
                cb();
            });
            _client.end();
        };
    };
    self.disconnect = function (cb) {
        cb(new Error('Client is not connected, so cannot disconnect.'));
    };
}

module.exports = Client;
