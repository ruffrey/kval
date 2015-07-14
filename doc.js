'use strict';
/**
 * The top level api for dealing with a single document.
 */
function Doc(model, seedProps) {
    var self = this;
    self._model = model;

    if (model.methods) {
        Object.keys(model.methods).forEach(function (methodName) {
            self[methodName] = function () {
                model.methods[methodName].apply(self, arguments);
            };
        });
    }
    var defaultIdGenerator = this._schema.properties.id.default;
    if (!this.id && defaultIdGenerator) {
        this.id = defaultIdGenerator();
    }
};
Doc.prototype.id = null;
/**
 * Remove the record and all indexes and uniques.
 */
Doc.prototype.remove = function remove(callback) {
    var txn = self._model.env.beginTxn();
    var self = this;
    txn.del(self._model._dbi, val);

    var saveProps = self.toObject();
    var indexes = [];
    var uniques = [];
    Object.keys(self._model._schema.properties).forEach(function (prop) {
        var schemaProp = self._model._schema.properties[prop];
        saveProps[prop] = self[prop];
        if (schemaProp.unique) {
            uniques.push(saveProps[prop]);
        } else if (schemaProp.index) {
            // Will be saved as key 'name:Jim Jack' to the value (the id) 'vUo5M1rRy8CmXpNcSo5f1FzQO7X4PNaJ'
            indexes.push(prop + ':' + saveProps[prop]);
        }
    });
    uniques.forEach(function (val) {
        txn.del(self._model._indexDbi, val);
    });
    indexes.forEach(function (val) {
        txn.del(self._model._indexDbi, val);
    });

    txn.commit();
    callback(null);
};
/**
 * Check validations, then save properties and indexes and unique indexes.
 */
Doc.prototype.save = function save(callback) {
    var self = this;
    var saveProps = self.toObject();
    var indexes = [];
    var uniques = [];
    Object.keys(self._model._schema.properties).forEach(function (prop) {
        var schemaProp = self._model._schema.properties[prop];
        saveProps[prop] = self[prop];
        if (schemaProp.unique) {
            uniques.push(saveProps[prop]);
        } else if (schemaProp.index) {
            // Will be saved as key 'name:Jim Jack' to the value (the id) 'vUo5M1rRy8CmXpNcSo5f1FzQO7X4PNaJ'
            indexes.push(prop + ':' + saveProps[prop]);
        }
    });
    var id = saveProps.id;
    delete saveProps.id;
    var txn = self._model.env.beginTxn();
    // the actual doc
    txn.putString(self._model._dbi, id, JSON.stringify(saveProps));
    var uniqueFailed = null;
    uniques.forEach(function (val) {
        var exists = txn.getString(self._model._indexDbi, val);
        if (exists && exists !== id) {
            uniqueFailed = new Error('Value already exits: ' + val.split(':')[0]);
            uniqueFailed.prop = val;
            uniqueFailed.id = exists;
            return;
        }
        txn.putString(self._model._indexDbi, val, id);
    });
    indexes.forEach(function (val) {
        txn.putString(self._model._indexDbi, val, id);
    });
    txn.commit();
    callback(null);
};
/**
 *
 */
Doc.prototype.toObject = function toObject() {
    var self = this;
    var ret = {};
    Object.keys(self._model._schema.properties).forEach(function (prop) {
        ret[prop] = self[prop];
    });
    self._model._schema.toObject(self, ret, self._model._schema);
};
/**
 *
 */
Doc.prototype.toString = function toString() {
    return JSON.stringify(this.toObject());
};

module.exports = Doc;
