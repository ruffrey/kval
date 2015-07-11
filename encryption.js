'use strict';
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';

exports.encrypt = function encrypt(text, password) {
    if (!text) {
        return text; // keeps it from crashing
    }
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
};

exports.decrypt = function decrypt(text, password) {
    if (!text) {
        return text; // keeps it from crashing
    }
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};
