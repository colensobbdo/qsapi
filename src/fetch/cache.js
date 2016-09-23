var DATASTORE = []

exports.get = (key) => {
    return DATASTORE[key]
}

exports.set = (key, value) => {
    DATASTORE[key] = value
}
