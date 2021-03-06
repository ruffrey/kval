'use strict';
var should = require('should');
var Client = require('../lib/client/client');
var async = require('async');

describe('Client', function () {
    it('exposes expected things', function () {
        var c1 = new Client();
        c1.connect.should.be.type('function');
    });
    it('allows separate instances', function () {
        var c1 = new Client();
        var c2 = new Client();
        c1.asdf = 'jkl';
        c2.asdf = 'mm';
        c1.asdf.should.not.equal(c2.asdf);
    });
});
