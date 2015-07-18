'use strict';
// setup stuff
var should = require('should');
var Db = require('../lib/dbms/dbms');
var async = require('async');
var db;
var path = require('path');
var encryption = require('../lib/encryption');
var dbpath = path.join(__dirname, '/../db/', encryption.uid());
// Test the normal client apis
var required = require('../index.js');
var Client = required.Client;
var Doc = required.Doc;
var Model = required.Model;
var client;

describe('normal client usage', function () {
    describe('Model', function () {
        before(function (done) {
            async.series([
                function (cb) {
                    db = new Db();
                    db.initialize({ path: dbpath }, cb);
                },
                function (cb) {
                    client = new Client();
                    client.connect({
                        host: '127.0.0.1',
                        port: 9226
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
        it('should be easily requireable', function () {
            should.exist(Model);
        });
        it('gets instantiated with schema', function () {
            var schema = {
                properties: {
                    name: {
                        type: 'string'
                    }
                }
            };
            var User = client.model('User1', schema);
            User.should.be.type('function');
        });
        it('can be used to create new docs', function () {
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
            var User = client.model('User2', schema);

            var user1 = new User({ name: 'Jim', age: 45 });
            user1.should.be.type('object');
            should.exist(user1.id);
            should.exist(user1.name);
            should.exist(user1.age);
            user1.name.should.equal('Jim');
            user1.age.should.equal(45);
            user1.id.should.be.type('string');

            var user2 = new User();
            should.exist(user1.id);
            should.not.exist(user2.name);
            should.not.exist(user2.age);
            user2.id.should.not.equal(user1.id);
        });
        it('docs toObject only keeps schema properties', function () {
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
            var User = client.model('User3', schema);

            var user1 = new User({ name: 'Jim', age: 45, eyes: 'blue' });
            should.not.exist(user1.eyes);
        });
        it('docs can be created, read, updated, and deleted in db', function (done) {
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
});
