'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _CALL_API = require('./CALL_API');

var _CALL_API2 = _interopRequireDefault(_CALL_API);

var _validation = require('./validation');

var Validation = _interopRequireWildcard(_validation);

var _errors = require('./errors');

var Errors = _interopRequireWildcard(_errors);

var _util = require('./util');

var Utils = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function apiMiddleware(_ref) {
    var getState = _ref.getState;

    return function (next) {
        return async function (action) {

            if (!Validation.isRSAA(action)) {
                return next(action);
            }

            var callAPI = action[_CALL_API2.default];
            var validationErrors = Validation.validateRSAA(action);
            if (validationErrors.length > 0) {

                if (callAPI.types && AriaRequestEvent.isRSAA(callAPI.types)) {
                    var request = callAPI.types[0];
                    if (request && request.type) {
                        request = type;
                    }

                    next({
                        type: request,
                        payload: new Errors.InvalidActionError(validationErrors),
                        error: true
                    });
                }

                return;
            }

            var endpoint = callAPI.endpoint;
            var headers = callAPI.headers;
            var timeout = callAPI.timeout;
            var method = callAPI.method;
            var body = callAPI.body;
            var credentials = callAPI.credentials;
            var bailout = callAPI.bailout;
            var types = callAPI.types;

            var _Utils$getTypes = Utils.getTypes(types);

            var _Utils$getTypes2 = _slicedToArray(_Utils$getTypes, 3);

            var request = _Utils$getTypes2[0];
            var scucess = _Utils$getTypes2[1];
            var failure = _Utils$getTypes2[2];


            try {
                if (typeof bailout === 'boolean' && bailout) {
                    return;
                } else if (typeof bailout === 'function' && (await bailout(getState())) === true) {
                    return;
                }
            } catch (e) {
                if (typeof bailout === 'function' && bailout(getState())) {
                    return;
                }

                return next((await actionWith(request, [action, getState(), new Errors.RequestError('bailout failed for CALL_API')])));
            }

            if (typeof endpoint === 'function') {
                try {
                    endpoint = endpoint(getState());
                } catch (e) {
                    return next((await actionWith(failureType, [action, getState(), new Errors.RequestError('endpoint function failed for CALL_API')])));
                }
            }

            next((await actionWith(request, [action, getState()])));

            var t;

            try {
                var res;
                var config = {
                    url: endpoint,
                    method: method,
                    data: body,
                    withCredentials: credentials,
                    headers: headers || {},
                    timeout: timeout || 0
                };

                if (timeout) {
                    t = setTimeout(async function () {
                        failure.meta = action;
                        return next((await actionWith(failure, [action, getState(), new Errors.TimeoutError('CALL_API exceeded timeout of ' + timeout / 1000 + ' seconds')])));
                    }, timeout);
                }

                res = await (0, _axios2.default)(config);
            } catch (e) {
                var failureAction = await actionWith({
                    type: failure.type || failure,
                    meta: action,
                    payload: failure.payload || e
                }, [action, getState(), e]);

                return next(failureAction);
            }

            if (t) {
                clearTimeout(t);
            }

            if (res.status === 200) {
                return next((await actionWith(success, [action, getState(), res])));
            } else {
                return next((await Utils.actionWith({ type: failure.type || failure, meta: action }, [action, getState(), res])));
            }
        };
    };
}