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
        toObject: function (doc, ret, schema) {}
    };
};
/**
 * @inherits Doc
 */
function Model(props) {
    Doc.call(this, props);
}
Model.prototype.__proto__ = Doc.prototype;
Model.prototype._modelName;
Model.prototype._client;
Model.prototype._schema;

// Queries

/**
 * Retrieve a single doc by id.
 */
Model.findById = function (id, callback) {
    var self = this;
    self.prototype._client.get({
        model: self.prototype._modelName,
        id: id
    }, function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data) {
            return callback(null, data);
        }
        data.id = id;
        var mod = new Model(data);
        mod._modelName = self.prototype._modelName;
        callback(null, mod);
    });
};
/**
 * Run a query operation against the database model.
 *
 * @param object params - Required.
 * @param object options - optional.
 * @param function callback - optional.
 */
Model.find = function (params, options, callback) {
    var self = this;
    var queryPackage = {
        model: self._modelName,
        params: params,
        options: options
    };
    var resData = [];
    self._client.find(queryPackage, function (err, data) {
        if (err) {
            return callback(err);
        }
        if (!data) {
            return callback(null, resData);
        }
        for (var i = 0; i < data.length; i++) {
            mod = new Model(data[i]);
            resData.push(mod);
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
Model.findOne = function (params, options, callback) {
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

Model.compile = function (name, client, schema) {

    function FreshModel(doc) {
        if (!(this instanceof FreshModel)) {
            return new FreshModel(doc);
        }
        Model.call(this, doc);
    }

    FreshModel.__proto__ = Model;
    FreshModel.prototype.__proto__ = Model.prototype;
    FreshModel.prototype._modelName = name;
    FreshModel.prototype._client = Model.prototype._client = client;

    if (!schema.properties.id) {
        schema.properties.id = defaultSchema().properties.id;
    }
    if (!schema.toObject) {
        schema.toObject = defaultSchema().toObject;
    }
    FreshModel.prototype._schema = Model.prototype._schema = schema;
    return FreshModel;
};

module.exports = Model;
