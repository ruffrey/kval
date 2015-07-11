'use strict';
var rpc = require('rpc-stream');
var net = require('net');
var datastoreMethods = ['hello'];

function Client() {
    var self = this;
    self._client = null;
    self._connection = null;
    self.connect = function (netOptions, callback) {
        self._client = rpc();
        self._connection = net.connect(netOptions, callback);
        self._client.pipe(self._connection).pipe(self._client);
        self.methods = self._client.wrap(datastoreMethods);
    };
}

module.exports = Client;
