'use strict';
var should = require('should');
var Db = require('../db');
var Client = require('../client');
var client;
var async = require('async');
var db;

describe('connection', function () {
    describe('without a password', function () {
        beforeEach(function (done) {
            async.series([
                function (cb) {
                    db = new Db();
                    db.initialize({}, cb);
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
        afterEach(function (done) {
            async.series([
                function (cb) { client.disconnect(cb); },
                function (cb) { db.close(cb); }
            ], done);
        });
        it('should connect and send a ping', function (done) {
            client.methods.ping('yo', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.indexOf('yo').should.not.equal(-1);
                done();
            });
        });
    });
    describe.only('with a password', function () {
        beforeEach(function (done) {
            async.series([
                function (cb) {
                    db = new Db();
                    db.initialize({ password: 'asdf' }, cb);
                },
                function (cb) {
                    client = new Client();
                    client.connect({
                        host: '127.0.0.1',
                        port: 9226,
                        password: 'asdf'
                    }, cb);
                }
            ], done);
        });
        afterEach(function (done) {
            async.series([
                function (cb) { client.disconnect(cb); },
                function (cb) { db.close(cb); }
            ], done);
        });
        it('should connect and send a ping', function (done) {
            client.methods.ping('yo', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.indexOf('yo').should.not.equal(-1);
                done();
            });
        });
    });
});