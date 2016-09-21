import {expect} from 'code'
import {describe, before, it} from 'mocha'

import Schema from '../src/schema'
import {type, _default, transform} from '../src/symbols'
import * as _ from 'lodash'


var obj = {
    products: [
        {
            id: 'product1',
            price: 55
        },
        {
            id: 'product2',
            price: "66.5"
        },
        {
            id: 'product3',
            price: '$11.00'
        }
    ]
}

var schema = {
    'products': {

        id: {
            [type]: 'string'
        },

        price: {
            [transform]: (price) => {
                return parseFloat(price.toString().replace('$', ''), 2)
            }
        }
    }
}

describe('QSAPI Schema Mapper', () => {
    it('should parse the data correctly', (done) => {

        var newObj = Schema(obj, schema)
        expect(newObj).to.be.exist()
        expect(newObj.products[0].id).to.exist()
        expect(newObj.products[0].price).to.exist()

        done()
    })
})
