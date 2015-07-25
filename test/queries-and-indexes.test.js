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
var User;

describe.only('Queries and indexing', function () {
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
            },
            function (cb) {
                var schema = {
                    properties: {
                        name: {
                            type: 'string'
                        },
                        age: {
                            type: 'number',
                            index: true
                        },
                        email: {
                            type: 'string',
                            unique: true
                        }
                    }
                };
                User = client.model('User', schema);
                cb();
            }
        ], done);
    });
    after(function (done) {
        async.series([
            function (cb) { client.disconnect(cb); },
            function (cb) { db.close(cb); }
        ], done);
    });
    it('is queryable by index', function (done) {
        var user = new User({ name: 'Bill', age: 32, email: 'asdf@example.com' });
        user.save(function (err) {
            should.not.exist(err);
            User.find({ email: 'asdf@example.com' }, function (err, docs) {
                should.not.exist(err);
                console.log(docs);
                should.exist(docs);
                var doc = docs[0];
                doc.should.be.an.Object().and.not.an.Array();
                doc.should.have.property('id');
                doc.should.have.property('email');
                doc.email.should.equal('asdf@example.com');
                done();
            });
        });
    });
});
