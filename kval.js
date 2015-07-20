// This file is the one compiled into a binary module by nexe.
'use strict';
// jxcore option
process.on('uncaughtException', function (err) {
    console.error('Main process uncaughtException event', err.message, err.stack);
});

process.env.DEBUG = 'kval*';
var args = {};

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

// args.workers = args.workers ? parseFloat(args.workers) : 2;

// var fork = require('child_process').fork;
// var child = fork('./worker.js');
// function method(args) {
//     process.title = 'kval_worker_' + process.threadId;
//     console.log('kval worker', process.threadId, args);
//     var Db = require('./lib/dbms/dbms');
//     new Db().initialize(args, function (err) {
//         if (err) { throw err; }
//     });
//     setTimeout(function () {
//         throw new Error('Whoopsie');
//     }, 5000 * (Math.random() + 1));
//     process.keepAlive();
//     // process.on('uncaughtException', function (err) {
//     //     console.error('subprocess uncaughtException event', err.message, err.stack);
//     //     process.exit();
//     // });
//     process.on('restart', function (restartCallback) {
//         console.log('subprocess restart event', process.threadId);
//         restartCallback();
//     });
// }
//
// jxcore.tasks.setThreadCount(args.workers);
// jxcore.tasks.runOnce(method, args);
// process.stdin.resume(); // run forever
// jxcore.tasks.addTask(method, args);

var Db = require('./lib/dbms/dbms');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
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
