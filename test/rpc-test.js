'use strict';
var net = require('net');
var rpc = require('rpc-stream')

describe('rpc test', function () {
    before(function (done) {
        net.createServer(function (con) {
            var server = rpc({
                hello: function (name, cb) {
                    cb(null, 'hello, ' + name)
                }
            });
            server.pipe(con).pipe(server);
        }).listen(3000, done);
    })
    it('sends the message over tcp', function (done) {
        var client = rpc()
        var con = net.connect(3000)
        client.pipe(con).pipe(client)

        var remote = client.wrap(['hello'])
        remote.hello('steve', function (err, res) {
            console.log(err, res)
            done()
        })
    });
})
