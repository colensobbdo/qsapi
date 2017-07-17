import {expect} from 'code'
import {describe, before, it} from 'mocha'

import Fetch from '../src/fetch'

import * as _ from 'lodash'

describe('Fetch', () => {

    it('should format the options correctly if passed a string', (done) => {

        var url = 'http://google.co.nz'
        var {url: fetchUrl} = Fetch.options(url)
        expect(fetchUrl).to.equal(url)
        done()
    })

    it('should format the options correctly if passed an object', (done) => {

        var opts = {
            url: 'http://google.co.nz'
        }

        var {url, opts: options} = Fetch.options(opts)
        expect(options.url).to.equal(opts.url)
        done()
    })

    it('should overwrite default data', (done) => {

        var opts = {
            url: 'http://foo.bar',
            timeout: 2000
        }

        var {opts: options} = Fetch.options(opts)
        expect(options.timeout).to.equal(2000)
        done()
    })

    it('should return an instance', (done) => {

        var opts = {
            url: 'http://www.google.co.nz',
            timeout: 1000
        }

        var instance = Fetch.req(opts)
        expect(instance).to.exist()
        done()
    })

    it('should get data', (done) => {

        var opts = {
            url: 'http://www.google.co.nz',
            timeout: 1000,
            retry: false
        }

        var instance = Fetch.req(opts)
        instance.then((res) => { done() })
    })

    it('should bailout', (done) => {

        var opts = {
            url: 'http://httpstat.us/500',
            timeout: 2000,
            retry: false,
            bailout: () => {
                return true
            }
        }
        
        var instance = Fetch.req(opts)
        instance.then((res) => { 
            if (res.bailed) {
                done()
            }
        })
    })

    it('should timeout', (done) => {

        var opts = {
            url: 'http://google.com',
            timeout: 5,
            retry: false
        }

        var instance = Fetch.req(opts)
        instance.catch((err) => { 
            expect(err.code).to.equal('ECONNABORTED')
            done() 
        })
    })

    it('should cache', (done) => {

        var opts = {
            url: 'http://www.google.co.nz',
            timeout: 1000,
            cache: true
        }

        var instance = Fetch.req(opts)
        instance.then((res) => { 

            var secondInstance = Fetch.req(opts)
            secondInstance.then((secondRes) => {
                if (secondRes.cached) {
                    done()
                }
            })
        })
    })

    it('should retry', (done) => {

        var expectedRetryCount = 1
        var retryCount = 0

        var opts = {
            url: 'http://httpstat.us/500',
            timeout: 2000,
            retry: () => {
                retryCount++
            },
            retryCount: expectedRetryCount,
        }

        var instance = Fetch.req(opts)
        instance.catch((err) => {
            expect(expectedRetryCount).to.equal(retryCount)
            done()
        })
    })


    it('should setup a cache correctly', (done) => {

        var config = {
            cache: require('../src/fetch/cache')
        }

        var foo = Fetch.init(config)
        if (foo instanceof Object) {
            done()
        }
    })

    it('should catch a cache initialisation error correctly', (done) => {
        var config = {
            cache: {
                get: () => {} 
            }
        }

        var foo = Fetch.init(config)
        if (foo instanceof Error) {
            done()
        }
    })

    it('should handle urlencoded POST data', (done) => {
        var expectedRetryCount = 1
        var retryCount = 0

        var opts = {
            url: 'https://httpbin.org/post',
            method: 'POST',
            timeout: 20000,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                foo: 'bar'
            }
        }

        var instance = Fetch.req(opts)
        instance.then(body => {
            expect(body.data.form).to.equal({foo: 'bar'})
            expect(body.data.headers['Content-Type']).to.equal('application/x-www-form-urlencoded')
            done()
        })
    })
})