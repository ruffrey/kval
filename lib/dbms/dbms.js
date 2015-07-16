'use strict';
var lmdb = require('node-lmdb');
var fs = require('fs');
var net = require('net');
var rpc = require('rpc-stream');
var async = require('async');
var rpcRoutes = require('./rpc-routes');
var megabyte = 1024 * 1024 * 1024;
var debug = require('debug')('kval-db');

/**
 * The database management system object.
 */
function Dbms() {
    var self = this;
    var models = {};
    self._env = null;
    self._net = null;

    /**
     * Instantiate, if applicable, and return the dbi store.
     */
    self.model = function (name) {
        // when already initialized
        if (models[name]) {
            return models[name];
        }
        var indexStoreName = name + '_indexes';
        models[name] = { };
        debug('instantiating new store', name);
        models[name].dbi = self._env.openDbi({
            name: name,
            create: true
        });
        debug('instantiating new index store', indexStoreName);
        models[name].indexDbi = self._env.openDbi({
            name: indexStoreName,
            create: true
        });

        return models[name];
    };

    /**
     * Expose the `net.close` method, for shutting down the server. Overwritten
     * after connecting.
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
     * @params function callback=`function (err) { }`
     */
    self.initialize = function (options, callback) {
        options = options || {};
        callback = callback || function (err) {};

        var steps = [];
        var envOptions = {
            path: options.path || __dirname + "/db",
            mapSize: options.mapSize || 100 * megabyte, // maximum database size
            maxDbs: options.maxDbs || 10
        };
        debug('init db', envOptions);
        var port = options.port || 9226;
        var host = options.host || '127.0.0.1';
        var password = options.password;

        // Setup stuff
        if (password) {
            debug('with encryption');
        } else {
            debug('no encryption');
        }

        steps.push(function ensureDbPath(cb) {
            fs.exists(envOptions.path, function (exists) {
                if (exists) {
                    return cb();
                }
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
                var server = rpc(rpcRoutes(password, con, self._env, self.model));

                function onNetRpcServerStreamError(err) {
                    debug('net error', err.message, err.stack);
                    con.destroy();
                }
                con.on('error', onNetRpcServerStreamError);
                server.on('error', onNetRpcServerStreamError);

                server.pipe(con).pipe(server);
            });

            self._net.listen(port, host, cb);
            self._net.once('error', cb);

            // Expose the method to shut down the socket
            self.close = function (cb) {
                cb = cb || function () {}
                debug('closing down server...');
                self._net.close(function (err) {
                    if (err) {
                        debug('server close error', err.message, err.stack);
                    } else {
                        debug('server closed successfully.');
                    }
                    cb(err);
                });
            };
        });

        async.series(steps, callback);
    };
}
module.exports = Dbms;
