import {expect} from 'code'
import {describe, it} from 'mocha'

import Qsapi, {Fetch, Schema} from '../src'
const {type, initial, transform} = Schema

describe('QSAPI', () => {

    it('should return a function', (done) => {
        expect(Qsapi).to.exist()
        expect(Qsapi).to.be.a.function()

        done()
    })

    it('should export schema', (done) => {
        expect(Schema).to.exist()
        expect(Schema).to.be.object()
        done()
    })

    it('should export fetch', (done) => {
        expect(Fetch).to.exist()
        expect(Fetch).to.be.object()
        done()
    })

    it('should fetch transform an object', (done) => {

        var schema = {
            ip: {
                [type]: 'String',
                [initial]: '127.0.0.1',
                [transform]: (ip) => {

                    var groups = ip.split('.')
                    return `${groups[0]}.${groups[1]}.${groups[2]}.0/24`
                }
            }
        }

        var initialData = {
            ip: '127.0.0.1'
        }

        var options = {
            url: 'http://whatismyip.azurewebsites.net/json/'
        }

        var qsapi = Qsapi(options, schema, initialData)

        qsapi.fetch()
            .then((res) => {
                expect(res.ip).to.contain('/24')
                done()
            })
            .catch((err) => {
                console.log(err)
            })
    })

})
