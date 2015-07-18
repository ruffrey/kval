'use strict';
var async = require('async');
var debug = require('debug')('kval-rpc-encrypt-wrapper');
var encryption = require('../encryption');
// Wrap the methods in a JSON stringify / parse and encrypt / decrypt layer.
module.exports = function (_client, password) {
    return function generateEncryptWrappedCallForMappedClientMethod(m) {
        var originalMethod = _client.methods[m];
        _client[m] = function encryptWrappedClientCall(inputData, encryptCb) {
            async.waterfall([

                function stringifyIfNecessary(cb) {
                    inputData = inputData || null;
                    if (typeof inputData !== 'string') {
                        inputData = JSON.stringify(inputData);
                    }
                    debug(m + ' initial data length', inputData.length);
                    cb(null, inputData);
                },

                function preEncryptData(data, cb) {
                    encryption.encrypt(data, password, function (err, dataEncrypted) {
                        if (err) { return cb(err); }
                        debug(m + ' after encryption, data length is', dataEncrypted.length);
                        cb(null, dataEncrypted);
                    });
                },

                function doRpcMethodSend(data, cb) {
                    debug(m + ' sending now', data.length);
                    originalMethod(data, function (err, resData) {
                        debug('response in originalMethod', err, resData);
                        cb(err, resData);
                    });
                },

                function processAndWrapRpcResponse(data, cb) {
                    if (!data) {
                        debug(m + ' received empty response');
                        return cb(null, data);
                    }
                    debug(m + ' pre decryption data length', data.length);
                    encryption.decrypt(data, password, function (err, text) {
                        if (err) { return cb(err); }

                        debug(m + ' post decryption data length', text.length);

                        var receivedData;
                        try {
                            receivedData = JSON.parse(text);
                        } catch (ignored) {
                            receivedData = text;
                        } // i guess it is just a normal string

                        // Format for returning non-connection related errors.
                        // Construct an error from it.
                        if (receivedData && receivedData.error) {
                            err = new Error(receivedData.error);
                            err.status = receivedData.status; // optional
                            return cb(err);
                        }
                        cb(null, receivedData);
                    });
                }

            ], encryptCb);

        };
    }
};
