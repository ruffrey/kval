'use strict';
// setup stuff
var should = require('should');
var Db = require('../../lib/dbms/dbms');
var async = require('async');
var db;
var path = require('path');
var encryption = require('../../lib/encryption');
var dbpath = path.join(__dirname, '/../../db/', encryption.uid());
// Test the normal client apis
var required = require('../../index.js');
var Client = required.Client;
var Doc = required.Doc;
var Model = required.Model;
var client;
var password = encryption.uid();

describe.only('CRUD over net benchmark with password', function () {
    before(function (done) {
        async.series([
            function (cb) {
                db = new Db();
                db.initialize({ path: dbpath, password: password }, cb);
            },
            function (cb) {
                client = new Client();
                client.connect({
                    host: '127.0.0.1',
                    port: 9226,
                    password: password
                }, cb);
            }
        ], done);
    });
    after(function (done) {
        async.series([
            function (cb) { client.disconnect(cb); },
            function (cb) { db.close(cb); }
        ], done);
    });

    it('insert 50,000 records in parallel', function (done) {
        this.timeout(60000);
        var schema = {
            properties: {
                name: {
                    type: 'string'
                },
                age: {
                    type: 'number'
                },
                hair: {
                    type: 'string'
                },
                heightCentimeters: {
                    type: 'number'
                }
            }
        };
        var User = client.model('User1', schema);
        async.times(50000, function (n, cb) {
            new User({ name: 'Jim', age: 45, hair: 'brown', height: 100 }).save(cb);
        }, done);
    });
    it('insert 50,000 records in series', function (done) {
        this.timeout(60000);
        var schema = {
            properties: {
                name: {
                    type: 'string'
                },
                age: {
                    type: 'number'
                },
                hair: {
                    type: 'string'
                },
                heightCentimeters: {
                    type: 'number'
                }
            }
        };
        var User = client.model('User2', schema);
        async.timesSeries(50000, function (n, cb) {
            new User({ name: 'Jim', age: 45, hair: 'brown', height: 100 }).save(cb);
        }, done);
    });
    xit('docs can be created, read, updated, and deleted in db', function (done) {
        var schema = {
            properties: {
                name: {
                    type: 'string'
                },
                age: {
                    type: 'number'
                }
            }
        };
        var User = client.model('User4', schema);

        var user = new User({ name: 'Bill', age: 32 });
        should.exist(user.id);
        async.waterfall([
            function saveUser(cb) {
                user.save(cb);
            },
            function checkSavedThenGetIt(saved, cb) {
                should.exist(saved);
                should.exist(saved.id);
                saved.name.should.equal('Bill');
                saved.age.should.equal(32);
                user.id.should.equal(saved.id);
                User.findById(saved.id, cb);
            },
            function checkInDbThenUpdateIt(gotUser, cb) {
                should.exist(gotUser);
                should.exist(gotUser.id);
                user.id.should.equal(gotUser.id);
                gotUser.age.should.equal(32);
                gotUser.age = 33;
                gotUser.save(cb);
            },
            function checkUpdatesThenFindAgain(updatedUser, cb) {
                should.exist(updatedUser);
                user.id.should.equal(updatedUser.id);
                updatedUser.age.should.equal(33);
                User.findById(updatedUser.id, cb);
            },
            function checkUpdatesInDbThenRemove(gotUser, cb) {
                should.exist(gotUser);
                should.exist(gotUser.id);
                user.id.should.equal(gotUser.id);
                gotUser.age.should.equal(33);
                gotUser.remove(cb)
            },
            function ensureWasRemoved(cb) {
                User.findById(user.id, function (err, gotUser) {
                    should.not.exist(err);
                    should.not.exist(gotUser);
                    cb();
                });
            }
        ], done);
    });
});
