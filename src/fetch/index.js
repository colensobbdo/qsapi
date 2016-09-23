import * as _ from 'lodash'
import axios from 'axios'
var Cache = require('./cache')

console.log(Cache)

var defaults = {
    timeout: 1000,
    method: 'get',
    bailout: () => { return false },
    cache: false
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

    return { url: opts.url, opts }
}

const request = (opts) => {

    var {url, opts} = options(opts)

    if (opts.bailout && opts.bailout()) {
        return new Promise((res) => { res({ bailed: true }) })
    }

    if (opts.cache && Cache.get(opts.url)) {
        debugger
        var response = Cache.get(opts.url)
        response.cached = true

        return Promise.resolve(response)
    }

    var instance = axios.create(opts)
    
    if (opts.cache) {
        instance.interceptors.response.use((config) => {

            Cache.set(opts.url, config)

            return config
        })
    }

    return instance[opts.method](url)
}

export default {

    init: (config) => {
        if (config.cache) {
            if (config.cache.hasOwnProperty('get') && config.cache.hasOwnProperty('set')) {
                Cache = config.cache
                return config
            }
            else {
                return new Error('Invalid caching setup')
            }
        }
    },

    options,

    request,

    req: request
}