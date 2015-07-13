'use strict';
var rpc = require('rpc-stream');
var net = require('net');
var debug = require('debug')('kval-client');
var encryption = require('./lib/encryption');
var algorithm = 'aes-256-ctr';

function Client() {
    var self = this;
    self._client = null;
    self._connection = null;
    self.datastoreMethods = ['ping'];
    self.connect = function (netOptions, callback) {
        debug('connecting...');
        if (netOptions.password) {
            debug('init with encryption');
        } else {
            debug('init with no encryption');
        }

        self._client = rpc(null);

        // Make the net connection
        self._connection = net.connect(netOptions, function (err) {
            if (err) { debug('connect error', err.message, err.stack); }
            else { debug('connected.'); }
            if (err) { return callback(err); }
            if (!netOptions.password) { return callback(); }
            // Check authorization by generating a random token and ensuring
            // it is decrypted with the password on the other end, then
            // returned as the same token.
            var token = '';
            while (token.length < 256) {
                token += Math.random().toString(36).substring(2);
            }
            token = token.substring(0, 256);
            self.ping(token, function (err, res) {
                var comparison = [token, res];
                if (err) { return callback(err); }
                if (token !== res) {
                    err = new Error('Auth password is invalid.');
                    err.status = 401;
                    return callback(err, comparison);
                }
                callback(null, comparison);
            });
        });

        // Additional configurations
        self._client
            .pipe(self._connection)
            .pipe(self._client);

        var methods = self._client.wrap(self.datastoreMethods);
        // Bind the methods to the client instance, wrapping them in the encryption
        // and decryption if applicable.
        Object.keys(methods).forEach(function (m) {
            self[m] = function encryptWrappedClientCall(inputData, callback) {
                inputData = inputData || null;
                if (typeof inputData !== 'string') {
                    inputData = JSON.stringify(inputData);
                }
                debug('initial sending data length', inputData.length);
                if (netOptions.password && inputData) {
                    encryption.encrypt(inputData, algorithm, netOptions.password, function (err, d) {
                        debug('post encryption data length', inputData.length);
                        inputData = d;
                        doIt();
                    });
                } else {
                    doIt();
                }
                function doIt() {
                    debug('sending now', inputData.length)
                    methods[m](inputData, function decryptWrappedClientCallback(err, receivedData) {
                        if (receivedData) {
                            debug('receved data length', receivedData.length);
                        }
                        if (!err && netOptions.password && receivedData) {
                            debug('pre decryption data length', receivedData.length);
                            encryption.decrypt(receivedData, algorithm, netOptions.password, function (err, text) {
                                if (err) { return callback(err); }
                                receivedData = text;
                                debug('post decryption data length', receivedData.length);
                                keepGoing();
                            });
                        } else {
                            keepGoing();
                        }
                        function keepGoing() {
                            try {
                                receivedData = JSON.parse(receivedData);
                            } catch (ignored) { } // just a normal string
                            callback(err, receivedData);
                        }
                    });
                }
            };
        });
        self.disconnect = function (cb) {
            debug('disconnecting...');
            self._client.once('end', function () {
                debug('disconnected successfully.');
                cb();
            });
            self._client.end();
        };
    };
    self.disconnect = function (cb) {
        cb(new Error('Client is not connected, so cannot disconnect.'));
    };
}

module.exports = Client;
