import Schema from './schema'
import Fetch from './fetch'

var Qsapi = (options, schema, initialData) => {

    var qsapi = {}
    qsapi.options = options
    qsapi.schema = schema
    qsapi.initialData = initialData


    if ( ! initialData) {
        qsapi.fetch = () => {
            return new Promise((res, rej) => {
                Fetch.req(options)
                    .then((response) => {
                        return response
                    })
                    .then((response) => {
                        res(Schema.parse(response.data, schema))
                    })
                    .catch((err) => {
                        rej(err)
                    })
            })
        }
    }
    else {
        qsapi.fetch = () => {
            return new Promise((res, rej) => {
                try {
                    var result = Schema.parse(initialData, schema)
                    res(result)
                }
                catch (e) {
                    rej(e)
                }
            })
        }
    }

    return qsapi
}

Qsapi.Schema = Schema
Qsapi.Fetch = Fetch

module.exports = Qsapi
