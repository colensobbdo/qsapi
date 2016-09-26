import * as _ from 'lodash'
import axios from 'axios'
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

    if (_.isPlainObject(opts)) {
        opts = _.assign({}, defaults, opts)
    }
    else {
        opts = _.assign({}, defaults, {
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
            if (err.response && err.response.status !== 200 && err.config && err.config.retryCount > 0) {

                // eslint complainin about err.config.retryConfig--
                err.config.retryCount = err.config.retryCount - 1

                if (typeof opts.retry === 'function') {
                    opts.retry(err.config)
                }

                var retryInstance = axios.create(err.config)
                instance.interceptors.response.use(undefined, retry)
                return retryInstance[err.config.method.toLowerCase()](err.config.url)
            }

            throw err
        }

        instance.interceptors.response.use(undefined, retry)
    }

    return instance[opts.method.toLowerCase()](url)
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
