var should = require('should');
var encryption = require('../lib/encryption');
xdescribe('encryption', function () {
    describe('uid', function () {
        it('should generate values at specified lengths', function () {
            function testLength(len) {
                var i = 1000;
                var val;
                while (i--) {
                    val = encryption.uid(len);
                    val.length.should.equal(len);
                }
            }
            testLength(32);
            testLength(512);
            testLength(2048);
        });
        it('should not generate duplicates at default length for 2 million iterations', function () {
            this.timeout(10000);
            var all = {};
            var i = 2000000;
            while (i--) {
                all[encryption.uid()] = undefined;
            }
            Object.keys(all).length.should.equal(2000000);
        });
    });
});
