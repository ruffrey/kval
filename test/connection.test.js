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
            client.ping('yo', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.indexOf('yo').should.not.equal(-1);
                done();
            });
        });
        it('should not fail on empty data', function (done) {
            client.ping('', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                done();
            });
        });
        it('should truncate anything longer than 50 chars', function (done) {
            client.ping('-123456789-123456789-123456789-123456789-123456789-123456789', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.length.should.be.lessThan(5 + 50);
                done();
            });
        });
    });
    describe('with a password', function () {
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
            client.ping('yo', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.indexOf('yo').should.not.equal(-1);
                done();
            });
        });
        it('should not fail on empty data', function (done) {
            client.ping('', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                done();
            });
        });
        it('should truncate anything longer than 50 chars', function (done) {
            client.ping('-123456789-123456789-123456789-123456789-123456789-123456789', function (err, res) {
                if (err) {
                    return done(err);
                }
                res.indexOf('sup').should.not.equal(-1);
                res.length.should.be.lessThan(5 + 50);
                done();
            });
        });
    });
});
