// This file is the one compiled into a binary module by nexe.
'use strict';
process.env.DEBUG = 'kval*';
var args = {};
console.log('argv', process.argv);

var arg;
var spl;
var key;
var val;
for (var i = 1; i < process.argv.length; i++) {
    arg = process.argv[i];
    arg = arg.replace('--', '');
    spl = arg.split('=');
    key = spl[0];
    val = spl[1];
    args[key] = val;
}

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var Db = require('./lib/dbms/dbms');

function startWorker() {
    process.title = 'kval_worker';
    console.log('kval worker', args);
    new Db().initialize(args, function (err) {
        if (err) { throw err; }
    });
}
startWorker();
// if (cluster.isMaster) {
//     process.title = 'kval_master';
//     // Fork workers.
//     for (var i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }
//     cluster.on('exit', function (worker, code, signal) {
//         console.log('worker ' + worker.process.pid + ' died');
//         cluster.fork();
//     });
// } else {
//     startWorker();
// }
