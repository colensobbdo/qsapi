'use strict';

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _fetch = require('./fetch');

var _fetch2 = _interopRequireDefault(_fetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Qsapi = function Qsapi(options, schema, initialData) {

    var qsapi = {};
    qsapi.options = options;
    qsapi.schema = schema;
    qsapi.initialData = initialData;

    if (!initialData) {
        qsapi.fetch = function () {
            return new Promise(function (res, rej) {
                _fetch2.default.req(options).then(function (response) {
                    return response;
                }).then(function (response) {
                    res(_schema2.default.parse(response.data, schema));
                }).catch(function (err) {
                    rej(err);
                });
            });
        };
    } else {
        qsapi.fetch = function () {
            return new Promise(function (res, rej) {
                try {
                    var result = _schema2.default.parse(initialData, schema);
                    res(result);
                } catch (e) {
                    rej(e);
                }
            });
        };
    }

    return qsapi;
};

Qsapi.Schema = _schema2.default;
Qsapi.Fetch = _fetch2.default;

module.exports = Qsapi;