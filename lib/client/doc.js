'use strict';
/**
 * The top level api for dealing with a single document.
 */
function Doc(seedProps) {
    seedProps = seedProps || {};
    var self = this;
    // self._model = model;
    var schema = self._schema;

    if (schema.methods) {
        Object.keys(schema.methods).forEach(function (methodName) {
            self[methodName] = function () {
                schema.methods[methodName].apply(self, arguments);
            };
        });
    }
    // Apply default properties
    Object.keys(schema.properties).forEach(function (propName) {
        self[propName] = seedProps[propName];
        if (typeof self[propName] === 'undefined') {
            var defaultPropGen = schema.properties[propName].default;
            var typeofPropGen = typeof defaultPropGen;
            if (typeofPropGen === 'function') {
                self[propName] = defaultPropGen();
            } else if (typeofPropGen !== 'undefined') {
                self[propName] = JSON.parse(JSON.stringify(defaultPropGen));
            }
        }
    });
};

Doc.prototype.id = null;
/**
 * Remove the record and all indexes and unique indexes.
 */
Doc.prototype.remove = function remove(callback) {
    var self = this;
    var saveProps = self.toObject();
    var indexes = [];
    Object.keys(self._schema.properties).forEach(function (prop) {
        var schemaProp = self._schema.properties[prop];
        if (schemaProp.unique || schemaProp.index) {
            indexes.push(prop + ':' + self.id);
        }
    });
    var deletePackage = { model: this._modelName, id: this.id, indexes: indexes };
    this._client.del(deletePackage, function (err, resObject) {
        callback(err);
    });
};
/**
 * Check validations, then save properties and indexes and unique indexes.
 */
Doc.prototype.save = function save(callback) {
    var self = this;
    var saveProps = self.toObject();
    var indexes = [];
    var uniques = [];
    Object.keys(self._schema.properties).forEach(function (prop) {
        var schemaProp = self._schema.properties[prop];
        saveProps[prop] = self[prop];
        if (schemaProp.unique) {
            uniques.push(prop + ':' + saveProps[prop]);
        } else if (schemaProp.index) {
            // Will be saved as key 'name:Jim Jack' to the value (the id) 'vUo5M1rRy8CmXpNcSo5f1FzQO7X4PNaJ'
            indexes.push(prop + ':' + saveProps[prop]);
        }
    });
    var id = saveProps.id;
    delete saveProps.id;

    self._client.put({
        model: self._modelName,
        id: id,
        data: saveProps,
        indexes: indexes,
        uniques: uniques
    }, function (err) {
        callback(err, self);
    });
};
/**
 *
 */
Doc.prototype.toObject = function toObject() {
    var self = this;
    var ret = {};
    Object.keys(self._schema.properties).forEach(function (prop) {
        var schemaProp = self._schema.properties[prop];
        var rightType = typeof self[prop] === schemaProp.type;
        if (rightType) {
            ret[prop] = self[prop];
        }
    });
    // Apply the custom `toObject` function supplied by the end user
    self._schema.toObject(self, ret, self._schema);
    return ret;
};
/**
 *
 */
Doc.prototype.toString = function toString() {
    return JSON.stringify(this.toObject());
};

module.exports = Doc;
