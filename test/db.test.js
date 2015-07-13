'use strict';
var should = require('should');
var Db = require('../db');
var fs = require('fs');
var rimraf = require('rimraf');
var path = require('path');
var testdir;

describe('Db', function () {
    describe('before initialization', function () {
        it('gives an error when trying to close the db', function (done) {
            var db1 = new Db();
            db1.close(function (err) {
                should.exist(err);
                done();
            });
        });
    });
    describe('initialization dir creation', function () {
        before(function () {
            testdir = path.resolve(__dirname +  '/../build/' + Math.random().toString(36).substring(2, 9));
        });
        after(function (done) {
            rimraf(testdir, done);
        });
        it('creates the directory when it does not exist', function (done) {
            var db1 = new Db();
            fs.existsSync(testdir).should.not.be.ok;
            db1.initialize({ path: testdir }, function (err) {
                if (err) { return done(err); }
                fs.existsSync(testdir).should.be.ok;
                db1.close(done);
            });
        });
    });
});
