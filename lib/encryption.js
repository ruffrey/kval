// Encryption and decryption
// Note: compression makes things bigger. Huh?
'use strict';
var crypto = require('crypto');
var READABLE_ENCODING = 'utf8';
var ENCRYPTED_ENCODING = 'base64';
var KEYLEN = 512;
var ALGORITHM = 'aes-256-ctr';

exports.encrypt = function encrypt(text, password, callback) {
    if (!text) { return text; }
    var cipher = crypto.createCipher(ALGORITHM, password);
    var crypted = cipher.update(text, READABLE_ENCODING, ENCRYPTED_ENCODING);
    crypted += cipher.final(ENCRYPTED_ENCODING);
    callback(null, crypted);
};
exports.decrypt = function decrypt(text, password, callback) {
    if (!text) { return callback(null, text); }
    var decipher = crypto.createDecipher(ALGORITHM, password);
    var dec = decipher.update(text, ENCRYPTED_ENCODING, READABLE_ENCODING);
    dec += decipher.final(READABLE_ENCODING);
    callback(null, dec);
};
exports.signToken = function signToken(clientToken, dbToken, callback) {
    crypto.pbkdf2(clientToken, dbToken, 2048, KEYLEN, function (err, key) {
        if (err) { return callback(err); }
        callback(null, key.toString('base64'));
    });
};
exports.getToken = function getToken() {
    return exports.uid(KEYLEN);
};
var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.uid = function uid(len) {
    len = len || 32;
    var result = '';
    for (var i = len; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
};
