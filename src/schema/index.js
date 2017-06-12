import concat from 'lodash/concat'
import flatMap from 'lodash/flatMap'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import keys from 'lodash/keys'
import map from 'lodash/map'
import mapKeys from 'lodash/mapKeys'
import pull from 'lodash/pull'
import set from 'lodash/set'

import {type, custom, required, initial, transform, rename} from './symbols'

const paths = (obj, parentKey) => {
    var result

    if (isArray(obj)) {
        var index = 0
        result = flatMap(obj, function (newObj) {
            return paths(newObj, (parentKey || '') + '[' + index ++ + ']')
        })
    }
    else if (isPlainObject(obj)) {
        result = flatMap(keys(obj), function (key) {
            return map(paths(obj[key], key), function (subkey) {
                return (parentKey ? parentKey + '.' : '') + subkey
            })
        })
    }
    else {
        result = []
    }

    return concat(result, parentKey || [])
}

const applyDefaults = (obj, defaults) => {

    var mapDefaultsForKey = (key) => {

        return mapKeys(defaults, (val, defaultKey) => {
            if ( ! obj[key][defaultKey] && defaultKey !== '') {
                obj[key][defaultKey] = val
            }
        })
    }

    for (var key in obj) {
        if (isArray(obj[key])) {
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
        return mapKeys(requiredData, (val, requiredKey) => {

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
        if (isArray(obj[key])) {
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
        if (isArray(obj[key])) {
            removeUndefined(obj[key])
        }
        else {
            obj = pull(obj, undefined)
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

    rename,

    parse: (data, schema) => {

        var parsed = []

        var flatData = paths(data)
        var flatSchema = paths(schema)
        flatSchema.push('')
        var defaults = []
        var requiredData = []

        for (var key in flatSchema) {
            let path = flatSchema[key]
            let item = get(schema, path)
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

                let item = get(schema, searchPath)
                var value = get(data, path)

                if ( ! item) {
                    continue
                }

                if (item[type] || item[required]) {
                    set(parsed, path, value)
                }

                if (item[custom]) {
                    var customValue = item[custom](value)
                    if (customValue) {
                        var currentValue = get(parsed, path)
                        set(parsed, path, Object.assign({}, currentValue, customValue))
                    }
                }

                // check if the schema requires this be transformed
                if (item[transform]) {
                    value = item[transform](value)
                    set(parsed, path, value)
                }

                // check if the schema requires this be renamed
                if (item[rename]) {
                    var newPath = `${path.substr(0, path.lastIndexOf('.'))}.${item[rename]}`
                    set(parsed, newPath, value)
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
