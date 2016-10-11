'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

    if (_.isPlainObject(opts)) {
        opts = _.assign({}, defaults, opts);
    } else {
        opts = _.assign({}, defaults, {
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
                if (err.response && err.response.status !== 200 && err.config && err.config.retryCount > 0) {

                    // eslint complainin about err.config.retryConfig--
                    err.config.retryCount = err.config.retryCount - 1;

                    if (typeof opts.retry === 'function') {
                        opts.retry(err.config);
                    }

                    var retryInstance = _axios2.default.create(err.config);
                    instance.interceptors.response.use(undefined, retry);
                    return retryInstance[err.config.method.toLowerCase()](err.config.url);
                }

                throw err;
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