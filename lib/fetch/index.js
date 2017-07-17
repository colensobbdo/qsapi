'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Cache = require('./cache');

var defaults = {
    timeout: 1000,
    method: 'get',
    bailout: function bailout() {
        return false;
    },
    cache: false,
    retryCount: 3,
    retry: true
};

var options = function options(opts) {

    if ((0, _isPlainObject2.default)(opts)) {
        opts = (0, _assign2.default)({}, defaults, opts);
    } else {
        opts = (0, _assign2.default)({}, defaults, {
            url: opts
        });
    }

    return { url: opts.url, opts: opts };
};

var request = function request(params) {
    var _options = options(params);

    var url = _options.url;
    var opts = _options.opts;


    if (opts.bailout && opts.bailout()) {
        return new Promise(function (res) {
            res({ bailed: true });
        });
    }

    if (opts.cache && Cache.get(opts.url)) {
        var response = Cache.get(opts.url);
        response.cached = true;

        return Promise.resolve(response);
    }

    var instance = _axios2.default.create(opts);

    instance.interceptors.response.use(function (config) {
        if (opts.cache) {
            Cache.set(opts.url, config);
        }

        return config;
    });

    if (opts.retry) {
        (function () {

            var retry = function retry(err) {
                if ((err.response && err.response.status !== 200 || err.code === 'ECONNABORTED') && err.config && err.config.retryCount > 0) {

                    // eslint complaining about err.config.retryConfig--
                    err.config.retryCount = err.config.retryCount - 1;

                    if (typeof opts.retry === 'function') {
                        opts.retry(err.config);
                    }

                    var retryInstance = _axios2.default.create(err.config);
                    retryInstance.interceptors.response.use(undefined, retry);
                    return retryInstance[err.config.method.toLowerCase()](err.config.url);
                } else {

                    throw err;
                }
            };

            instance.interceptors.response.use(undefined, retry);
        })();
    }

    return instance[opts.method.toLowerCase()](url);
};

exports.default = {

    init: function init(config) {
        if (config.cache) {
            if (config.cache.hasOwnProperty('get') && config.cache.hasOwnProperty('set')) {
                Cache = config.cache;
            } else {
                return new Error('Invalid caching setup');
            }
        }

        return config;
    },

    options: options,

    request: request,

    req: request
};