'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _concat = require('lodash/concat');

var _concat2 = _interopRequireDefault(_concat);

var _flatMap = require('lodash/flatMap');

var _flatMap2 = _interopRequireDefault(_flatMap);

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _keys = require('lodash/keys');

var _keys2 = _interopRequireDefault(_keys);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _mapKeys = require('lodash/mapKeys');

var _mapKeys2 = _interopRequireDefault(_mapKeys);

var _pull = require('lodash/pull');

var _pull2 = _interopRequireDefault(_pull);

var _set = require('lodash/set');

var _set2 = _interopRequireDefault(_set);

var _symbols = require('./symbols');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var paths = function paths(obj, parentKey) {
    var result;

    if ((0, _isArray2.default)(obj)) {
        var index = 0;
        result = (0, _flatMap2.default)(obj, function (newObj) {
            return paths(newObj, (parentKey || '') + '[' + index++ + ']');
        });
    } else if ((0, _isPlainObject2.default)(obj)) {
        result = (0, _flatMap2.default)((0, _keys2.default)(obj), function (key) {
            return (0, _map2.default)(paths(obj[key], key), function (subkey) {
                return (parentKey ? parentKey + '.' : '') + subkey;
            });
        });
    } else {
        result = [];
    }

    return (0, _concat2.default)(result, parentKey || []);
};

var applyDefaults = function applyDefaults(obj, defaults) {

    var mapDefaultsForKey = function mapDefaultsForKey(key) {

        return (0, _mapKeys2.default)(defaults, function (val, defaultKey) {
            if (!obj[key][defaultKey] && defaultKey !== '') {
                obj[key][defaultKey] = val;
            }
        });
    };

    for (var key in obj) {
        if ((0, _isArray2.default)(obj[key])) {
            applyDefaults(obj[key], defaults[key]);
        } else {
            mapDefaultsForKey(key);
        }
    }

    return obj;
};

var validateRequired = function validateRequired(obj, requiredData) {

    var removeRequiredsForKey = function removeRequiredsForKey(key) {
        return (0, _mapKeys2.default)(requiredData, function (val, requiredKey) {

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
        if ((0, _isArray2.default)(obj[key])) {
            validateRequired(obj[key], requiredData[key]);
        } else {
            removeRequiredsForKey(key);
        }
    }

    return obj;
};

var removeUndefined = function removeUndefined(obj) {

    for (var key in obj) {
        if ((0, _isArray2.default)(obj[key])) {
            removeUndefined(obj[key]);
        } else {
            obj = (0, _pull2.default)(obj, undefined);
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
            var item = (0, _get2.default)(schema, path);
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

                var _item = (0, _get2.default)(schema, searchPath);
                var value = (0, _get2.default)(data, _path);

                if (!_item) {
                    continue;
                }

                if (_item[_symbols.type] || _item[_symbols.required]) {
                    (0, _set2.default)(parsed, _path, value);
                }

                if (_item[_symbols.custom]) {
                    var customValue = _item[_symbols.custom](value);
                    if (customValue) {
                        var currentValue = (0, _get2.default)(parsed, _path);
                        (0, _set2.default)(parsed, _path, _extends({}, currentValue, customValue));
                    }
                }

                // check if the schema requires this be transformed
                if (_item[_symbols.transform]) {
                    value = _item[_symbols.transform](value);
                    (0, _set2.default)(parsed, _path, value);
                }

                // check if the schema requires this be renamed
                if (_item[_symbols.rename]) {
                    var newPath = _path.substr(0, _path.lastIndexOf('.')) + '.' + _item[_symbols.rename];
                    (0, _set2.default)(parsed, newPath, value);
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