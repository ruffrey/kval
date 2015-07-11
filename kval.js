'use strict';
process.title = 'kval';
var argv = require('yargs').argv;
var Db = require('./db');
new Db(argv).initialize({}, function (err) {
    if (err) {
        throw err;
    }
});
