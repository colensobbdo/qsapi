test:
	BABEL_CACHE_PATH=./babel.json ./node_modules/.bin/mocha --recursive test --compilers js:babel-register


.PHONY: test
