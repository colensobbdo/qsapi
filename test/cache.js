import {expect} from 'code'
import {describe, before, it} from 'mocha'

import Cache from '../src/fetch/cache'

describe('Cache', () => {

    it('should set and get data correctly', (done) => {

        Cache.set('key', 'value')

        var res = Cache.get('key')
        expect(res).to.equal('value')
        done()
    })

    it('should overwrite data correctly', (done) => {

        Cache.set('overwrite', 'value')
        Cache.set('overwrite', 'value2')

        var res = Cache.get('overwrite')
        expect(res).to.equal('value2')
        done()
    })
})