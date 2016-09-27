import * as _ from 'lodash'

import {type, custom, initial, transform} from './symbols'

const paths = (obj, parentKey) => {
    var result

    if (_.isArray(obj)) {
        var index = 0
        result = _.flatMap(obj, function (newObj) {
            return paths(newObj, (parentKey || '') + '[' + index ++ + ']')
        })
    }
    else if (_.isPlainObject(obj)) {
        result = _.flatMap(_.keys(obj), function (key) {
            return _.map(paths(obj[key], key), function (subkey) {
                return (parentKey ? parentKey + '.' : '') + subkey
            })
        })
    }
    else {
        result = []
    }

    return _.concat(result, parentKey || [])
}

const applyDefaults = (obj, defaults) => {

    var mapDefaultsForKey = (key) => {

        return _.mapKeys(defaults, (val, defaultKey) => {
            if ( ! obj[key][defaultKey] && defaultKey !== '') {
                obj[key][defaultKey] = val
            }
        })
    }

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            applyDefaults(obj[key], defaults[key])
        }
        else {
            mapDefaultsForKey(key)
        }
    }

    return obj
}

export default {

    type,

    initial,

    transform,

    custom,

    parse: (data, schema) => {

        var parsed = []

        var flatData = paths(data)
        var flatSchema = paths(schema)
        var defaults = []

        for (var key in flatSchema) {
            let path = flatSchema[key]
            let item = _.get(schema, path)
            if (item[initial]) {
                let parentPath = path.split('.')
                let prop = parentPath.pop()
                parentPath.join('.')

                defaults[parentPath] = {[prop]: item[initial]}
            }
        }

        for (var dataKey in flatData) {
            let path = flatData[dataKey]
            let searchPath = path.replace(/\[\d+\]/, '[0]')

            if (flatSchema.indexOf(searchPath) >= 0) {

                let item = _.get(schema, searchPath)
                var value = _.get(data, path)

                if ( ! item) {
                    continue
                }

                if (item[type]) {
                    _.set(parsed, path, value)
                }

                if (item[custom]) {
                    //var currentValue = _.get(parsed, path)
                    var customValue = item[custom](value)
                    if (customValue) {
                        var currentValue = _.get(parsed, path)
                        _.set(parsed, path, Object.assign({}, currentValue, customValue))
                    }
                }

                // check if the schema requires this be transformed
                if (item[transform]) {
                    value = item[transform](value)
                    _.set(parsed, path, value)
                }

            }
        }

        return applyDefaults(parsed, defaults)
    }
}
