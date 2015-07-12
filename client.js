'use strict';
var rpc = require('rpc-stream');
var crypto = require('crypto');
var net = require('net');
var debug = require('debug')('kval-client');
// var encryption = require('./lib/encryption');
var algorithm = 'aes-256-ctr';

function Client() {
    var self = this;
    self._client = null;
    self._connection = null;
    self.datastoreMethods = ['ping'];
    self.connect = function (netOptions, callback) {
        debug('connecting...');
        var encrypt;
        var decrypt;
        if (netOptions.password) {
            debug('with encryption');
            encrypt = crypto.createCipher(algorithm, netOptions.password);
            decrypt = crypto.createDecipher(algorithm, netOptions.password);
        } else {
            debug('no encryption');
        }

        self._client = rpc();

        // Make the net connection
        self._connection = net.connect(netOptions, function (err) {
            if (err) { debug('connect error', err.message, err.stack); }
            else { debug('connected.'); }
            callback(err);
        });

        // Additional configurations

        if (encrypt && decrypt) {
            self._client
                .pipe(decrypt)
                .pipe(self._connection)
                .pipe(encrypt)
                .pipe(self._client);
        } else {
            self._client
                .pipe(self._connection)
                .pipe(self._client);
        }

        var methods = self._client.wrap(self.datastoreMethods);
        Object.keys(methods).forEach(function (m) {
            self[m] = methods[m];
        });
        self.disconnect = function (cb) {
            debug('disconnecting...');
            self._client.once('end', function () {
                debug('disconnected.');
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
