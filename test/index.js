import {expect} from 'code'
import {describe, before, it} from 'mocha'

import QSAPI from '../src'

describe('QSAPI', () => {

    it('should return an object', (done) => {
        expect(QSAPI).to.exist()
        expect(QSAPI).to.be.an.object()

        done()
    })
})
