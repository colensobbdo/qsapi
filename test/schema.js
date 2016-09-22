import {expect} from 'code'
import {describe, before, it} from 'mocha'

import Schema from '../src/schema'
import {type, _default, transform} from '../src/symbols'
import * as _ from 'lodash'


var obj = {
    products: [
        {
            id: 'product1',
            price: 55,
            name: 'some product 1'
        },
        {
            id: 'product2',
            price: "66.5",
            name: 'some product 2'
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

    it('should handle the default correctly', (done) => {

        var newSchema = {
            'products': {
                id: {
                    [type]: 'string',
                },

                price: {
                    [_default]: 'Free'
                },

                name: {
                    [_default]: 'a product'
                }
            }
        }

        var newObj = Schema(obj, newSchema)

        // make sure 'a product' is set to the object which doesn't have a name
        expect(newObj.products[2].name).to.equal('a product')

        // make sure that price is not overwritten
        for (var prop in newObj.products) {
            var product = newObj.products[prop]
            expect(product.price).to.not.equal('Free')
        }

        done()
    })

    it('should parse the data correctly', (done) => {

        var newObj = Schema(obj, schema)
        expect(newObj).to.be.exist()
        expect(newObj.products[0].id).to.exist()
        expect(newObj.products[0].price).to.exist()

        done()
    })
})
