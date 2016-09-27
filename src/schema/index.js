import * as _ from 'lodash'

import {type, custom, required, initial, transform} from './symbols'

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

const validateRequired = (obj, requiredData) => {

    var removeRequiredsForKey = (key) => {
        return _.mapKeys(requiredData, (val, requiredKey) => {

            if (requiredKey === '') {
                return
            }

            if (typeof val === 'function' && typeof obj[key] !== 'undefined') {
                var keepField = val(obj[key][requiredKey])
                if ( ! keepField) {
                    obj[key] = undefined
                }
            }
            else if (typeof val === 'boolean' && typeof obj[key] !== 'undefined' && ( ! obj[key][requiredKey] || obj[key][requiredKey] === '')) {

                if (val) {
                    obj[key] = undefined
                }
            }
        })
    }

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            validateRequired(obj[key], requiredData[key])
        }
        else {
            removeRequiredsForKey(key)
        }
    }

    return obj
}

const removeUndefined = (obj) => {

    for (var key in obj) {
        if (_.isArray(obj[key])) {
            removeUndefined(obj[key])
        }
        else {
            obj = _.pull(obj, undefined)
        }
    }

    return obj
}

export default {

    type,

    initial,

    transform,

    custom,

    required,

    parse: (data, schema) => {

        var parsed = []

        var flatData = paths(data)
        var flatSchema = paths(schema)
        flatSchema.push('')
        var defaults = []
        var requiredData = []

        for (var key in flatSchema) {
            let path = flatSchema[key]
            let item = _.get(schema, path)
            let parentPath = path.replace(/\[\d+\]\./, '.').split('.')
            let prop = parentPath.pop()
            parentPath.join('.')

            if (item && item[initial]) {

                defaults[parentPath] = {[prop]: item[initial]}
            }

            if (item && item[required]) {
                requiredData[parentPath] = Object.assign({}, requiredData[parentPath], { [prop]: item[required] })
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

                if (item[type] || item[required]) {
                    _.set(parsed, path, value)
                }

                if (item[custom]) {
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

        if (schema[custom]) {
            var customValue = schema[custom](data)
            if (customValue) {
                parsed = Object.assign({}, parsed, customValue)
            }
        }

        var defaultedData = applyDefaults(parsed, defaults)
        var parsedData = validateRequired(parsed, requiredData)
        return removeUndefined(parsedData)
    }
}
