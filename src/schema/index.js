import * as _ from 'lodash'

import {type, _defaut, transform} from '../symbols'

export default (data, schema) => {

    var parsed = []

    var flatData = paths(data)
    var flatSchema = paths(schema)


    for (var key in flatData) {
        var path = flatData[key]
        var searchPath = path.replace(/\[\d+\]\./gi, '.')

        if (flatSchema.indexOf(searchPath) > -1) {

            var value = _.get(data, path)
            var item = _.get(schema, searchPath.split('.'))

            if (item && (item[type] || item[transform])) {

                // check if the schema requires this be transformed
                if (item[transform]) {
                    value = item[transform](value)
                }

                _.set(parsed, path, value)
            }
        }
    }

    return parsed
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
