// This file is the one compiled into a binary module by nexe.
'use strict';
process.title = 'kval';
var argv = require('yargs').argv;
var Db = require('./lib/dbms/dbms');
new Db().initialize(argv, function (err) {
    if (err) { throw err; }
});
