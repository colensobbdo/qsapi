import {expect} from 'code'
import {describe, before, it} from 'mocha'

import {Schema} from '../src'
const {parse, required, type, initial, transform, rename} = Schema

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
    'products': [{

        id: {
            [type]: 'string'
        },

        price: {
            [transform]: (price) => {
                return parseFloat(price.toString().replace('$', ''), 2)
            }
        }
    }]
}

describe('QSAPI Schema Mapper', () => {

    it('should handle the default correctly', (done) => {

        var newSchema = {
            'products': [{
                id: {
                    [type]: 'string',
                },

                price: {
                    [initial]: 'Free'
                },

                name: {
                    [initial]: 'a product'
                }
            }]
        }

        var newObj = parse(obj, newSchema)

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

        var newObj = parse(obj, schema)
        expect(newObj).to.be.exist()
        expect(newObj.products[0].id).to.exist()
        expect(newObj.products[0].price).to.exist()

        done()
    })


    it('should parse the object from the README', (done) => {
        var data = {
            products: [
                {
                    id: 'product1',
                    name: 'product 1',
                    description: 'the first product',
                    price: 55
                }, 
                {
                    id: 'product2',
                    name: 'product 2',
                    description: 'the second product',
                    price: '66.50'
                },
                {
                    id: 'product3',
                    name: 'product 3',
                    price: '$11.00'
                }
            ]
        }


        var readmeSchema = {
            products: [{
                id: {
                    [type]: 'string'
                },

                name: {
                    [type]: 'string'
                },

                description: {
                    [initial]: 'N/a'
                },

                price: {
                    [transform]: (price) => {
                        return parseFloat(price.toString().replace('$', ''))
                    }
                }
            }]
        }

        var mappedData = parse(data, readmeSchema)
        expect(mappedData).to.exist()

        done()
    })

    it('should handle rename correctly', (done) => {
        var renameData = {
            products: [
                {
                    ID: 123
                },
                {
                    id: 456
                }
            ]
        }

        var renameSchema = {
            products: [{
                ID: {
                    [rename]: 'id'
                },

                id: {
                    [type]: 'number'
                }
            }]
        }

        var mappedData = parse(renameData, renameSchema)
        expect(mappedData).to.exist()
        expect(mappedData.products[0].id).to.exist()
        expect(mappedData.products[0].id).to.equal(123)
        expect(mappedData.products[1].id).to.exist()
        expect(mappedData.products[1].id).to.equal(456)
        done()
    })

    it('should handle required correctly', (done) => {
        var data = {
            products: [
                {
                    id: 'product1',
                    name: 'product 1',
                    description: 'the first product',
                    price: 55
                }, 
                {
                    id: 'product2',
                    description: 'the second product',
                    price: '66.50'
                },
                {
                    id: 'product3',
                    name: 'product 3',
                    price: '$11.00'
                }
            ]
        }


        var readmeSchema = {
            products: [{
                id: {
                    [type]: 'string'
                },

                name: {
                    [type]: 'string',
                    [initial]: 'fdsa'
                },

                description: {
                    [required]: true
                }
            }]
        }

        var mappedData = parse(data, readmeSchema)
        expect(mappedData).to.exist()
        expect(mappedData.products.length).to.equal(2)

        done()
    })
})
