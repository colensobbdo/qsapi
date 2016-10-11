"use strict";

var DATASTORE = [];

exports.get = function (key) {
    return DATASTORE[key];
};

exports.set = function (key, value) {
    DATASTORE[key] = value;
};