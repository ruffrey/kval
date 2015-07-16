var lmdb = require('node-lmdb');
var env = new lmdb.Env();
var path = require('path');
var encryption = require('../../lib/encryption');
var dbpath = path.join(__dirname, '/../../db/', encryption.uid());
var fs = require('fs');
fs.mkdirSync(dbpath);
var mb = 1024 * 1024 * 1024;
env.open({
    // Path to the environment
    // IMPORTANT: you will get an error if the directory doesn't exist!
    path: dbpath,
    mapSize: 25 * mb,
    // Maximum number of databases
    maxDbs: 10
});
var dbi;
var dbi1;
var dbi2;
var dbi3;

describe('lmdb driver', function () {
    this.timeout(10000);
    after(function () {
        // fs.unlinkSync(dbpath + '/data.mdb');
        // fs.unlinkSync(dbpath + '/lock.mdb');
        // fs.rmdir(dbpath);
    });
    describe('asynchronous', function () {
        before(function () {
            dbi = env.openDbi({
                name: 'sync-db',
                create: true,
                noMetaSync: true,
                noSync: true
            });
        });
        after(function () {
            dbi.close();
        });
        it('writes once', function (done) {
            var txn = env.beginTxn();
            txn.putString(dbi, "hello", "Hello world!");
            txn.commit();
            env.sync(done);
        });
        it('writes 2 million times', function (done) {
            // Begin transaction
            var txn = env.beginTxn();
            for (var i = 0; i < 2000000; i++) {
                txn.putString(dbi, "ello" + i, "Hello world!");
            }
            txn.commit();
            env.sync(done);
        });
    });
    describe('synchronous', function () {
        before(function () {
            dbi = env.openDbi({
                name: 'sync-db',
                create: true
            });
        });
        after(function () {
            dbi.close();
        });
        it('writes once', function () {
            var txn = env.beginTxn();
            txn.putString(dbi, "hello", "Hello world!");
            txn.commit();
        });
        it('writes 2 million times', function () {
            // Begin transaction
            var txn = env.beginTxn();
            for (var i = 0; i < 2000000; i++) {
                txn.putString(dbi, "ello" + i, "Hello world!");
            }
            txn.commit();
        });
    });
    describe.only('multiple dbs', function () {
        before(function () {
            dbi1 = env.openDbi({
                name: 'db1',
                create: true
            });
            dbi2 = env.openDbi({
                name: 'db2',
                create: true
            });
            dbi3 = env.openDbi({
                name: 'db3',
                create: true
            });
        });
        after(function () {
            dbi1.close();
            dbi2.close();
            dbi3.close();
        });
        it('opens and writes to multiple simultaneous dbs', function () {
            var tx = env.beginTxn();
            tx.putString(dbi1, encryption.uid(), 'hi1');
            tx.putString(dbi2, encryption.uid(), 'hi2');
            tx.putString(dbi3, encryption.uid(), 'hi3');
            tx.commit();
        });
    });
});
