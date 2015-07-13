// Encryption and decryption
// Note: compression makes things bigger. Huh?
'use strict';
var crypto = require('crypto');
var READABLE_ENCODING = 'utf8';
var ENCRYPTED_ENCODING = 'base64';
// var zlib = require('zlib');
var debug = require('debug')('encryption');
exports.encrypt = function encrypt(text, algorithm, password, callback) {
    if (!text) { return text; }
    // debug('before encrypt', text.length);
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, READABLE_ENCODING, ENCRYPTED_ENCODING);
    crypted += cipher.final(ENCRYPTED_ENCODING);
    callback(null, crypted);

    // debug('before compress', crypted.length);
    // zlib.deflate(new Buffer(crypted, ENCRYPTED_ENCODING), function (err, buff) {
    //     if (err) { return callback(err, text); }
    //     var out = buff.toString(ENCRYPTED_ENCODING);
    //     debug('after compress', out.length);
    //     callback(null, out);
    // });
};
exports.decrypt = function decrypt(text, algorithm, password, callback) {
    if (!text) { return callback(null, text); }

    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, ENCRYPTED_ENCODING, READABLE_ENCODING);
    dec += decipher.final(READABLE_ENCODING);
    // debug('after decrypt', dec.length);
    callback(null, dec);

    // debug('before decompress', text.length);
    // zlib.inflate(new Buffer(text, ENCRYPTED_ENCODING), function (err, buff) {
    //     if (err) { return callback(err, text); }
    //     text = buff.toString(ENCRYPTED_ENCODING);
    //     debug('after decompress', text.length);
    //     var decipher = crypto.createDecipher(algorithm, password);
    //     var dec = decipher.update(text, ENCRYPTED_ENCODING, READABLE_ENCODING);
    //     dec += decipher.final(READABLE_ENCODING);
    //     debug('after decrypt', dec.length);
    //     callback(null, dec);
    // });
};
