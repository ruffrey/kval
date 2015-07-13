// Encryption and decryption
// Note: compression makes things bigger. Huh?
'use strict';
var crypto = require('crypto');
var READABLE_ENCODING = 'utf8';
var ENCRYPTED_ENCODING = 'base64';
var algorithm = 'aes-256-ctr';
var debug = require('debug')('encryption');

exports.encrypt = function encrypt(text, password, callback) {
    if (!text) { return text; }
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, READABLE_ENCODING, ENCRYPTED_ENCODING);
    crypted += cipher.final(ENCRYPTED_ENCODING);
    callback(null, crypted);
};
exports.decrypt = function decrypt(text, password, callback) {
    if (!text) { return callback(null, text); }
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, ENCRYPTED_ENCODING, READABLE_ENCODING);
    dec += decipher.final(READABLE_ENCODING);
    callback(null, dec);
};
