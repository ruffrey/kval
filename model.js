'use strict';
var Doc = require('./doc');
/**
 * The top level api for dealing with a database instance model.
 */
function Model(env, dbi, schema) {
    this._env = env;
    this._dbi = dbi;
    this._schema = schema;
};
/**
 * Retrieve a single doc by id.
 */
Model.prototype.findById = function (id, callback) {
    var txn = this._env.beginTxn();
    var stringValue = txn.getString(dbi, 1);
    var parsedProperties = null;
    var doc = null;
    if (stringValue) {
        try {
            parsedProperties = JSON.parse(stringValue);
        } catch (ex) {
            return callback(ex);
        }
        doc = new Doc(this, parsedProperties);
    }
    callback(null, doc);
};
/**
 * Run a query operation against the database model.
 *
 * @param object params - Required.
 */
Model.prototype.find = function (params, options, callback) {
    if (!callback && typeof f === 'function') {
        callback = options;
    }

};
/**
 * Run a find and returning the first document.
 */
Model.prototype.findOne = function (params, options, callback) {
    params = params || {};
    var opts;
    if (!callback && typeof f === 'function') {
        callback = options;
        opts = {};
    } else {
        opts = options;
    }
    opts.limit = 1;
    this.find(params, opts, function (err, docs) {
        if (err) { return callback(err); }
        var doc = docs[0] || null;
        callback(null, doc);
    });
};

module.exports = Model;
