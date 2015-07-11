'use strict';
var lmdb = require('node-lmdb');
var fs = require('fs');
var net = require('net');
var rpc = require('rpc-stream');
// var zlib = require('zlib');
// var unzip = zlib.createGunzip();
// var zip = zlib.createGzip();
// var encryption = require('./lib/encryption');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var daemon = require('daemon');
var async = require('async');
var megabyte = 1024 * 1024 * 1024;
var debug = require('debug')('kval-db');

function Db() {
    var self = this;
    self.db = {};
    self._env = null;
    self._net = null;

    /**
     * Expose the `net.close` method, for shutting down the server.
     */
    self.close = function (cb) {
        cb(new Error('Socket has not been opened, so cannot be closed.'));
    };

    /**
     * Start the database engine.
     *
     * @params object options
     * @params string options.path=__dirname+"/db" - Path to the database folder.
     * @params string options.mapSize=100*megabyte - Maximum size to limit the database, in bytes.
     * @params int options.port=9226 - Listen on port
     * @params string options.host=127.0.0.1 - Listen on host(s)
     * @params string options.password - A pre-shared password
     * @params string options.passwordFile - Path to a pre-shared password file
     * @params bool options.daemonize=false
     * @params function callback=`function (err) { }`
     */
    self.initialize = function (options, callback) {
        options = options || {};
        callback = callback || function (err) { };

        var steps = [];
        var envOptions = {
            path: options.path || __dirname + "/db",
            mapSize: options.mapSize || 100 * megabyte, // maximum database size
            maxDbs: options.maxDbs || 3
        };
        var daemonize = !!options.daemonize;
        var port = options.port || 9226;
        var host = options.host || '127.0.0.1';
        var passwordFile = options.passwordFile;
        var password = options.password;
        var encrypt;
        var decrypt;

        // Setup stuff
        if (password) {
            debug('with encryption');
            decrypt = crypto.createDecipher(algorithm, password);
            encrypt = crypto.createCipher(algorithm, password);
        } else {
            debug('no encryption');
        }
        if (passwordFile) {
            steps.push(function retrievePassword(cb) {
                fs.readFile(passwordFile, function (err, contents) {
                    if (err) { return callback(err); }
                    password = contents.trim();
                    decrypt = crypto.createDecipher(algorithm, password);
                    encrypt = crypto.createCipher(algorithm, password);
                    cb();
                });
            });
        }

        steps.push(function ensureDbPath(cb) {
            fs.exists(envOptions.path, function (exists) {
                if (exists) { return cb(); }
                fs.mkdir(envOptions.path, cb);
            });
        });
        steps.push(function openDbEnvironment(cb) {
            self._env = new lmdb.Env();
            self._env.open(envOptions);
            cb();
        });
        steps.push(function startServer(cb) {
            self._net = net.createServer(function (con) {
                var server = rpc({
                    ping: function (data, next) {
                        var shortenedMessage = data.substring(0, 50);
                        debug('ping', shortenedMessage);
                        // prevent giant pings
                        next(null, 'sup ' + shortenedMessage);
                    }
                });
                if (encrypt && decrypt) {
                    server
                        .pipe(decrypt)
                        .pipe(con)
                        .pipe(encrypt)
                        .pipe(server);
                } else {
                    server.pipe(con).pipe(server);
                }
            });

            self._net.listen(port, host, function (err) {
                if (err) { return cb(err); }
                if (daemonize) {
                    daemon();
                    debug('running as daemon pid', process.pid);
                } else {
                    debug('running as pid', process.pid);
                }
                cb();
            });

            self._net.once('error', callback);

            // Expose the method to shut down the socket
            self.close = function (cb) {
                cb = cb || function () { }
                debug('closing down server...');
                self._net.close(function (err) {
                    if (err) { debug('server close error', err.message, err.stack); }
                    else { debug('server closed successfully.'); }
                    cb(err);
                });
            };
        });

        async.series(steps, callback);
    };
}
module.exports = Db;
