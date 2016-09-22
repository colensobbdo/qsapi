import * as _ from 'lodash'

import {type, _default, transform} from './symbols'

export default {

    type,
    
    _default,
    
    transform,

    parse: (data, schema) => {

        var parsed = []

        var flatData = paths(data)
        var flatSchema = paths(schema)
        var defaults = []
        
        for (var key in flatSchema) {
            var path = flatSchema[key]
            var item = _.get(schema, path)
            if (item[_default]) {
                var parentPath = path.split('.')
                var prop = parentPath.pop()
                parentPath.join('.')

                defaults[parentPath] = { [prop]: item[_default] }
            }
        }

        for (var key in flatData) {
            var path = flatData[key]
            var searchPath = path.replace(/\[\d+\]\./gi, '.')
            var item = _.get(schema, searchPath.split('.'))

            if (flatSchema.indexOf(searchPath) > -1) {

                var value = _.get(data, path)

                if (item && (item[type] || item[transform] || item[_default])) {

                    // check if the schema requires this be transformed
                    if (item[transform]) {
                        value = item[transform](value)
                    }

                    var parentPath = searchPath.split('.')
                    var prop = parentPath.pop()
                    parentPath = parentPath.join('.')

                    _.set(parsed, path, value)
                }
            }
        }

        return applyDefaults(parsed, defaults)
    }

}

const paths = (obj, parentKey) => {
    var result

    if (_.isArray(obj)) {
        var index = 0
        result = _.flatMap(obj, function (obj) {
            return paths(obj, (parentKey || '') + '[' + index++ + ']')
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


    for (var key in obj) {
        if (_.isArray(obj[key])) {
            applyDefaults(obj[key], defaults[key])
        }
        else {
            // iterate over defaults
            
            _.mapKeys(defaults, (val, defaultKey) => {
                if ( ! obj[key][defaultKey]) {
                    obj[key][defaultKey] = val
                }
            })
        }
    }
    

    return obj
}