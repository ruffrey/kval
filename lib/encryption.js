// Synchronous encryption and decryption
'use strict';
var crypto = require('crypto');
exports.encryptSync = function encryptSync(text, algorithm, password) {
    if (!text) { return text; }
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
};
exports.decryptSync = function decryptSync(text, algorithm, password) {
    if (!text) { return text; }
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};
