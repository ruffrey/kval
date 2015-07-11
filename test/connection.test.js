'use strict';
var should = require('should');
var Db = require('../db');
var Client = require('../client');
var client;
var async = require('async');
var db;

describe('connection', function () {
    this.timeout(5000);
    before(function (done) {
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
    it('should connect and send a ping', function (done) {
        client.methods.hello('yo', function (err, res) {
            console.log(err, res);
            if (err) {
                return done(err);
            }
            console.log('client side', res);
            done();
        });
    });
});
