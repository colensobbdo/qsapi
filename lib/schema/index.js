'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _symbols = require('./symbols');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var paths = function paths(obj, parentKey) {
    var result;

    if (_.isArray(obj)) {
        var index = 0;
        result = _.flatMap(obj, function (newObj) {
            return paths(newObj, (parentKey || '') + '[' + index++ + ']');
        });
    } else if (_.isPlainObject(obj)) {
        result = _.flatMap(_.keys(obj), function (key) {
            return _.map(paths(obj[key], key), function (subkey) {
                return (parentKey ? parentKey + '.' : '') + subkey;
            });
        });
    } else {
        result = [];
    }

    return _.concat(result, parentKey || []);
};

var applyDefaults = function applyDefaults(obj, defaults) {

    var mapDefaultsForKey = function mapDefaultsForKey(key) {

        return _.mapKeys(defaults, function (val, defaultKey) {
            if (!obj[key][defaultKey] && defaultKey !== '') {
                obj[key][defaultKey] = val;
            }
        });
    };

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            applyDefaults(obj[key], defaults[key]);
        } else {
            mapDefaultsForKey(key);
        }
    }

    return obj;
};

var validateRequired = function validateRequired(obj, requiredData) {

    var removeRequiredsForKey = function removeRequiredsForKey(key) {
        return _.mapKeys(requiredData, function (val, requiredKey) {

            if (requiredKey === '') {
                return;
            }

            if (typeof val === 'function' && typeof obj[key] !== 'undefined') {
                var keepField = val(obj[key][requiredKey]);
                if (!keepField) {
                    obj[key] = undefined;
                }
            } else if (typeof val === 'boolean' && typeof obj[key] !== 'undefined' && (!obj[key][requiredKey] || obj[key][requiredKey] === '')) {

                if (val) {
                    obj[key] = undefined;
                }
            }
        });
    };

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            validateRequired(obj[key], requiredData[key]);
        } else {
            removeRequiredsForKey(key);
        }
    }

    return obj;
};

var removeUndefined = function removeUndefined(obj) {

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            removeUndefined(obj[key]);
        } else {
            obj = _.pull(obj, undefined);
        }
    }

    return obj;
};

exports.default = {

    type: _symbols.type,

    initial: _symbols.initial,

    transform: _symbols.transform,

    custom: _symbols.custom,

    required: _symbols.required,

    rename: _symbols.rename,

    parse: function parse(data, schema) {

        var parsed = [];

        var flatData = paths(data);
        var flatSchema = paths(schema);
        flatSchema.push('');
        var defaults = [];
        var requiredData = [];

        for (var key in flatSchema) {
            var path = flatSchema[key];
            var item = _.get(schema, path);
            var parentPath = path.replace(/\[\d+\]\./, '.').split('.');
            var prop = parentPath.pop();
            parentPath.join('.');

            if (item && item[_symbols.initial]) {

                defaults[parentPath] = _defineProperty({}, prop, item[_symbols.initial]);
            }

            if (item && item[_symbols.required]) {
                requiredData[parentPath] = _extends({}, requiredData[parentPath], _defineProperty({}, prop, item[_symbols.required]));
            }
        }

        for (var dataKey in flatData) {
            var _path = flatData[dataKey];
            var searchPath = _path.replace(/\[\d+\]/, '[0]');

            if (flatSchema.indexOf(searchPath) >= 0) {

                var _item = _.get(schema, searchPath);
                var value = _.get(data, _path);

                if (!_item) {
                    continue;
                }

                if (_item[_symbols.type] || _item[_symbols.required]) {
                    _.set(parsed, _path, value);
                }

                if (_item[_symbols.custom]) {
                    var customValue = _item[_symbols.custom](value);
                    if (customValue) {
                        var currentValue = _.get(parsed, _path);
                        _.set(parsed, _path, _extends({}, currentValue, customValue));
                    }
                }

                // check if the schema requires this be transformed
                if (_item[_symbols.transform]) {
                    value = _item[_symbols.transform](value);
                    _.set(parsed, _path, value);
                }

                // check if the schema requires this be renamed
                if (_item[_symbols.rename]) {
                    var newPath = _path.substr(0, _path.lastIndexOf('.')) + '.' + _item[_symbols.rename];
                    _.set(parsed, newPath, value);
                }
            }
        }

        if (schema[_symbols.custom]) {
            var customValue = schema[_symbols.custom](data);
            if (customValue) {
                parsed = _extends({}, parsed, customValue);
            }
        }

        var defaultedData = applyDefaults(parsed, defaults);
        var parsedData = validateRequired(parsed, requiredData);
        return removeUndefined(parsedData);
    }
};