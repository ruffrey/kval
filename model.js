'use strict';
var Doc = require('./doc');
var encryption = require('./lib/encryption');
/**
 * The top level api for dealing with a database instance model.
 * Schema:
 */
var defaultSchema = {
    properties: {
        id: {
            default: encryption.uid,
            type: 'string'
        }
    },
    methods: {},
    toObject: function (doc, ret, schema) {
        return ret;
    }
}

function Model(env, schema) {

    // the model can be called by an end user like this:
    // var user = new User({ myProp: '32adskf', id: 43 });
    if (arguments.length === 1 && typeof arguments[0] === 'object') {
        return new Doc(this, arguments[0]);
    }

    this._env = env;
    this._dbi = env.openDbi({
        name: name,
        create: true
    });
    this._indexDbi = env.openDbi({
        name: name + '_indexes',
        create: true
    });
    Object.keys(schema.properties).forEach()
    this._schema = schema;
}

// Queries

/**
 * Retrieve a single doc by id.
 */
Model.prototype.findById = function (id, callback) {
    var txn = this._env.beginTxn();
    var stringValue = txn.getString(this._dbi, 1);
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
        if (err) {
            return callback(err);
        }
        var doc = docs[0] || null;
        callback(null, doc);
    });
};

module.exports = Model;
