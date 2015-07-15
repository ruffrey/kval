'use strict';
var should = require('should');
var fs = require('fs');
var Db = require('../../lib/dbms/dbms');
var Client = require('../../lib/client/client');
var client;
var async = require('async');
var db;

var trials = 50000;

function generateTests(password) {
    return describe('password length ' + password.length, function () {
        beforeEach(function (done) {
            async.series([
                function (cb) {
                    db = new Db();
                    db.initialize({ password: password }, cb);
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
        afterEach(function (done) {
            async.series([
                function (cb) { client.disconnect(cb); },
                function (cb) { db.close(cb); }
            ], done);
        });
        it('in series', function (done) {
            async.timesSeries(trials, function (n, cb) {
                client.ping('yo', cb);
            }, done);
        });
        it('in parallel', function (done) {
            async.times(trials, function (n, cb) {
                client.ping('yo', cb);
            }, done);
        });
    });
}

describe('ping benchmarks, ' + trials + ' trials', function () {
    this.timeout(30000);
    generateTests('');
    generateTests('uka03Nkbl082bnks');
    generateTests('MIIEpAIBAAKCAQEA0aaE6zO9CXuknYF1A9BsT5ihogtaX2pGIUQ6CzNSULgX7Xon1VDHZj93XFFT9eNGudhKqhCTiQYFpM2zeWgS1fQ6RzCN5ux9oT0mukJouFpir9LvJM2wlEu3CxxfYBUJU3OvshQzlJaFVmqmmtXvPpp5GOVFb5wRWqEO4uPs7xuEHyLfjgYq1iv9xkOZF27IiSzDyNJFGQYO62pMlmo3twIGf9622qrnRRnr28jslNbdkk7X');
    generateTests('MIIEpAIBAAKCAQEA0aaE6zO9CXuknYF1A9BsT5ihogtaX2pGIUQ6CzNSULgX7Xon1VDHZj93XFFT9eNGudhKqhCTiQYFpM2zeWgS1fQ6RzCN5ux9oT0mukJouFpir9LvJM2wlEu3CxxfYBUJU3OvshQzlJaFVmqmmtXvPpp5GOVFb5wRWqEO4uPs7xuEHyLfjgYq1iv9xkOZF27IiSzDyNJFGQYO62pMlmo3twIGf9622qrnRRnr28jslNbdkk7XMIIEpAIBAAKCAQEA0aaE6zO9CXuknYF1A9BsT5ihogtaX2pGIUQ6CzNSULgX7Xon1VDHZj93XFFT9eNGudhKqhCTiQYFpM2zeWgS1fQ6RzCN5ux9oT0mukJouFpir9LvJM2wlEu3CxxfYBUJU3OvshQzlJaFVmqmmtXvPpp5GOVFb5wRWqEO4uPs7xuEHyLfjgYq1iv9xkOZF27IiSzDyNJFGQYO62pMlmo3twIGf9622qrnRRnr28jslNbdkk7XMIIEpAIBAAKCAQEA0aaE6zO9CXuknYF1A9BsT5ihogtaX2pGIUQ6CzNSULgX7Xon1VDHZj93XFFT9eNGudhKqhCTiQYFpM2zeWgS1fQ6RzCN5ux9oT0mukJouFpir9LvJM2wlEu3CxxfYBUJU3OvshQzlJaFVmqmmtXvPpp5GOVFb5wRWqEO4uPs7xuEHyLfjgYq1iv9xkOZF27IiSzDyNJFGQYO62pMlmo3twIGf9622qrnRRnr28jslNbdkk7XMIIEpAIBAAKCAQEA0aaE6zO9CXuknYF1A9BsT5ihogtaX2pGIUQ6CzNSULgX7Xon1VDHZj93XFFT9eNGudhKqhCTiQYFpM2zeWgS1fQ6RzCN5ux9oT0mukJouFpir9LvJM2wlEu3CxxfYBUJU3OvshQzlJaFVmqmmtXvPpp5GOVFb5wRWqEO4uPs7xuEHyLfjgYq1iv9xkOZF27IiSzDyNJFGQYO62pMlmo3twIGf9622qrnRRnr28jslNbdkk7X');
});
