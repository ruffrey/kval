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

var trials = 25000;

describe('CRUD over net benchmark with password', function () {
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

    it('insert ' + trials + ' records in parallel', function (done) {
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
        async.times(trials, function (n, cb) {
            new User({ name: 'Jim', age: 45, hair: 'brown', height: 100 }).save(cb);
        }, done);
    });
    it('insert ' + trials + ' records in series', function (done) {
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
        async.timesSeries(trials, function (n, cb) {
            new User({ name: 'Jim', age: 45, hair: 'brown', height: 100 }).save(cb);
        }, done);
    });
});
