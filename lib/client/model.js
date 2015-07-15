'use strict';
var Doc = require('./doc');
var encryption = require('../encryption');
/**
 * The top level api for dealing with a database instance model.
 * Schema:
 */
var defaultSchema = function () {
    return {
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
    };
}

function Model(name, client, schema) {

    // the model can be called by an end user like this:
    // var user = new User({ myProp: '32adskf', id: 43 });
    if (arguments.length === 1 && typeof arguments[0] === 'object') {
        return new Doc(this, arguments[0]);
    }
    this._name = name;
    this._client = client;
    // Object.keys(schema.properties).forEach()
    if (!schema.properties.id) {
        schema.properties.id = defaultSchema().properties.id
    }
    this._schema = schema;
}

// Queries

/**
 * Retrieve a single doc by id.
 */
Model.prototype.findById = function (id, callback) {
    var self = this;
    self._client.get({ model: self._name, id: id }, function (err, data) {
        if (err) { return callback(err); }
        if (!data) { return callback(null, data); }
        callback(null, new Doc(self, data));
    });
};
/**
 * Run a query operation against the database model.
 *
 * @param object params - Required.
 * @param object options - optional.
 * @param function callback - optional.
 */
Model.prototype.find = function (params, options, callback) {
    var self = this;
    var queryPackage = {
        model: self._name,
        params: params,
        options: options
    };
    var resData = [];
    self._client.find(queryPackage, function (err, data) {
        if (err) { return callback(err); }
        if (!data) { return callback(null, resData); }
        for (var i = 0; i < data.length; i++) {
            resData.push(new Doc(self, data[i]));
        }
        callback(null, resData);
    });
};
/**
 * Run a find and returning the first document.
 *
 * @param object params - Required.
 * @param object options - optional.
 * @param function callback - optional.
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
