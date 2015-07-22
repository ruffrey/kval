'use strict';
process.env.DEBUG = 'kval*';
process.on('uncaughtException', function (err) {
    console.error('Worker uncaughtException event', err.message, err.stack);
    process.exit();
});
var Db = require('./lib/dbms/dbms');

var env = {
    host: process.env.KVAL_WORKER_HOST,
    port: process.env.KVAL_WORKER_PORT,
    path: process.env.KVAL_WORKER_DB_PATH,
    mapSize: process.env.KVAL_WORKER_DB_MAX_SIZE_BYTES,
    password: process.env.KVAL_WORKER_PASSWORD
};
console.log('kval worker about to initialize', env);
new Db().initialize(env, function (err) {
    if (err) {
        console.log('db worker init error', err.message, err.stack);
        throw err;
    }
});
process.stdin.resume();
