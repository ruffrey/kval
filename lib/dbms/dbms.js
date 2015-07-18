'use strict';
var lmdb = require('node-lmdb');
var fs = require('fs');
var net = require('net');
var dnode = require('dnode');
var async = require('async');
var rpcRoutes = require('./rpc-routes');
var megabyte = 1024 * 1024 * 1024;
var debug = require('debug')('kval-db');

/**
 * The database management system object.
 */
function Dbms() {
    var self = this;
    self.models = {};
    self._env = null;
    self._net = null;
    self.password = null;
    self.routes = rpcRoutes;

    /**
     * Instantiate, if applicable, and return the dbi store.
     */
    self.model = function (name) {
        // when already initialized
        if (self.models[name]) {
            return self.models[name];
        }
        var indexStoreName = name + '_indexes';
        self.models[name] = { };
        debug('instantiating new store', name);
        self.models[name].dbi = self._env.openDbi({
            name: name,
            create: true
        });
        debug('instantiating new index store', indexStoreName);
        self.models[name].indexDbi = self._env.openDbi({
            name: indexStoreName,
            create: true
        });

        return self.models[name];
    };

    /**
     * Expose the `net.close` method, for shutting down the dbms server. Overwritten
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
        var password = options.password || '';
        self.password = password;
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
        steps.push(function startDbms(cb) {
            self._net = net.createServer(function (con) {
                var dbms = dnode(rpcRoutes(password, con, self._env, self.model));

                function onNetRpcServerStreamError(err) {
                    debug('net error', err.message, err.stack);
                    con.destroy();
                }
                con.on('error', onNetRpcServerStreamError);
                dbms.on('error', onNetRpcServerStreamError);

                dbms.pipe(con).pipe(dbms);
            });
            process.env.KVAL_PORT = port;
            process.env.KVAL_HOST = host;
            self._net.listen(port, host, function (err) {
                if (err) {
                    debug('listen failed', host, port, err.message, err.stack);
                    cb(err);
                } else {
                    debug('listening', host, port);
                    cb();
                }
            });
            self._net.once('error', cb);

            // Expose the method to shut down the socket
            self.close = function (netCloseCallback) {
                netCloseCallback = netCloseCallback || function () {}
                debug('closing down dbms...');
                self._net.close(function (err) {
                    if (err) {
                        debug('dbms close error', err.message, err.stack);
                    } else {
                        debug('dbms closed successfully.');
                    }
                    netCloseCallback(err);
                });
            };
        });

        async.series(steps, callback);
    };
}
module.exports = Dbms;
