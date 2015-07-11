'use strict';
var lmdb = require('node-lmdb');
var fs = require('fs');
var net = require('net');
var rpc = require('rpc-stream');
var zlib = require('zlib');
var unzip = zlib.createGunzip();
var zip = zlib.createGzip();
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var daemon = require('daemon');
var megabyte = 1024 * 1024 * 1024;

function Db() {
    var self = this;
    self.db = {};
    self._env = null;

    self.initialize = function (options, callback) {
        options = options || {};
        callback = callback || function (err) { };
        var envOptions = {
            path: options.path || __dirname + "/db",
            mapSize: options.mapSize || 100 * megabyte, // maximum database size
            maxDbs: options.maxDbs || 3
        };

        self._env = new lmdb.Env();

        var port = options.port || 9226;
        var host = options.host || '127.0.0.1';

        var passwordFile = options.passwordFile;
        var password = '';
        if (passwordFile) {
            password = fs.readFileSync(passwordFile).trim();
        }

        var decrypt;
        var encrypt;
        if (password) {
            decrypt = crypto.createDecipher(algorithm, password);
            encrypt = crypto.createCipher(algorithm, password);
        }

        if (!fs.existsSync(envOptions.path)) {
            fs.mkdirSync(envOptions.path);
        }

        self._env.open(envOptions);

        self._net = net.createServer(function (con) {
            var server = rpc({
                hello: function (data, cb) {
                    console.log('hello server side', data);
                    cb(null, data);
                }
            });
            server.pipe(con).pipe(server);
        });

        self._net.listen(port, host, function (err) {
            if (err) {
                return callback(err);
            }
            if (options.daemonize) {
                daemon();
                console.log('running as daemon pid', process.pid);
            } else {
                console.log('running as pid', process.pid);
            }
            callback();
        });

        self._net.once('error', function (e) {
            if (e.code == 'EADDRINUSE') {
                console.log('Address in use, retrying...');
                setTimeout(function () {
                    server.close();
                    server.listen(PORT, HOST);
                }, 1000);
            }
        });
    };
}
module.exports = Db;
