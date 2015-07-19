// This file is the one compiled into a binary module by nexe.
'use strict';
process.env.DEBUG = 'kval*';
var argv = require('yargs').argv;
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var Db = require('./lib/dbms/dbms');

function startWorker() {
    process.title = 'kval_worker';
    new Db().initialize(argv, function (err) {
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
