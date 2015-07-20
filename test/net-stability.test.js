'use strict';
var should = require('should');
var Db = require('../lib/dbms/dbms');
var Client = require('../lib/client/client');
var net = require('net');
var http = require('http');
var client;
var async = require('async');
var db;
var fs = require('fs');
var http = require('http');

describe('net stability', function () {
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
    it('db should not fail on receiving null ping', function (done) {
        client.ping(null, function (err, res) {
            if (err) {
                return done(err);
            }
            res.should.equal('');
            done();
        });
    });
    it('db should not fail on huge string', function (done) {
        var str = '';
        while (str.length < 1000000) {
            str += Math.random().toString(36).substring(2);
        }
        client.ping(str, function (err, res) {
            if (err) {
                return done(err);
            }
            res.length.should.equal(256);
            done();
        });
    });
    it('client should give a usable error when passwords mismatch', function (done) {
        var c = new Client();
        c.connect({
            host: '127.0.0.1',
            port: 9226,
            password: 'not-matching'
        }, function (err) {
            should.exist(err.status);
            err.status.should.equal(401);
            err.message.indexOf('password').should.not.equal(-1);
            c.disconnect(done);
        });
    });
    it('db should not die upon receiving HTTP request to telnet server', function (done) {
        http.get('http://127.0.0.1:9226/')
            .on('error', function (err) {
                should.exist(err);
                err.code.should.equal('HPE_INVALID_CONSTANT');
            });
        setTimeout(function () {
            client.ping('hey there', function (err, data) {
                should.not.exist(err);
                should.exist(data);
                data.should.equal('hey there');
                done();
            });
        }, 500);
    });
    it('should not fail when client has no password', function (done) {
        var c = new Client();
        c.connect({
            host: '127.0.0.1',
            port: 9226
        }, function (err) {
            should.not.exist(err);
            c.ping('hey', function (err, res) {
                should.exist(err);
                should.exist(err.status);
                err.status.should.equal(401);
                c.disconnect(done);
            });
        });
    });
});
