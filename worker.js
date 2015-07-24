'use strict';
process.env.DEBUG = 'kval*';
process.on('uncaughtException', function (err) {
    console.error('Worker uncaughtException event', err.message, err.stack);
    // process.exit();
});
console.log(process.argv);
var Db = require('./lib/dbms/dbms');

var env = {
    host: process.env.KVAL_WORKER_HOST || '127.0.0.1',
    port: process.env.KVAL_WORKER_PORT || 9226,
    path: process.env.KVAL_WORKER_DB_PATH || '/Users/jpx/kval/db/test1',
    mapSize: process.env.KVAL_WORKER_DB_MAX_SIZE_BYTES || 524288000,
    password: process.env.KVAL_WORKER_PASSWORD || ''
};
console.log('kval worker about to initialize', env);
new Db().initialize(env, function (err) {
    if (err) {
        console.log('db worker init error', err.message, err.stack);
        throw err;
    }
});
process.stdin.resume();
