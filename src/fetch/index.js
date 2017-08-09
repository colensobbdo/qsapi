import assign from 'lodash/assign'
import isPlainObject from 'lodash/isPlainObject'
import axios from 'axios'
import querystring from 'querystring'

var Cache = require('./cache')

var defaults = {
    timeout: 1000,
    method: 'get',
    bailout: () => {
        return false
    },
    cache: false,
    retryCount: 3,
    retry: true
}

const options = (opts) => {

    if (isPlainObject(opts)) {
        opts = assign({}, defaults, opts)
    }
    else {
        opts = assign({}, defaults, {
            url: opts
        })
    }

    return {url: opts.url, opts}
}

const request = (params) => {

    var {url, opts} = options(params)

    if (opts.bailout && opts.bailout()) {
        return new Promise((res) => {
            res({bailed: true})
        })
    }

    if (opts.cache && Cache.get(opts.url)) {
        var response = Cache.get(opts.url)
        response.cached = true

        return Promise.resolve(response)
    }

    var instance = axios.create(opts)

    instance.interceptors.response.use((config) => {
        if (opts.cache) {
            Cache.set(opts.url, config)
        }

        return config
    })

    if (opts.retry) {

        const retry = (err) => {
            if (((err.response && err.response.status !== 200) || err.code === 'ECONNABORTED') && err.config && err.config.retryCount > 0) {

                // eslint complaining about err.config.retryConfig--
                err.config.retryCount = err.config.retryCount - 1

                if (typeof opts.retry === 'function') {
                    opts.retry(err.config)
                }

                var retryInstance = axios.create(err.config)
                retryInstance.interceptors.response.use(undefined, retry)
                return retryInstance[err.config.method.toLowerCase()](err.config.url)
            }
            else {

                throw err
            }
        }

        instance.interceptors.response.use(undefined, retry)
    }

    if (opts.hasOwnProperty('headers') &&
        opts.headers.hasOwnProperty(['content-type']) &&
        opts.headers['content-type'].toLowerCase() === 'application/x-www-form-urlencoded' &&
        Object.keys(opts.data).length > 0) {

        return instance[opts.method.toLowerCase()](url, querystring.stringify(opts.data))
    }
    else {
        return instance[opts.method.toLowerCase()](url, opts.data)
    }
}

export default {

    init: (config) => {
        if (config.cache) {
            if (config.cache.hasOwnProperty('get') && config.cache.hasOwnProperty('set')) {
                Cache = config.cache
            }
            else {
                return new Error('Invalid caching setup')
            }
        }

        return config
    },

    options,

    request,

    req: request
}
