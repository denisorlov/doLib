$do = window.$do?$do:{};
$do.objectUtils = {};


$do.objectUtils.isBoolean = function(o) {};
$do.objectUtils.isNumber = function(o) {};
$do.objectUtils.isString = function(o) {};
$do.objectUtils.isFunction = function(o) {};
$do.objectUtils.isArray = function(o) {};
$do.objectUtils.isDate = function(o) {};
$do.objectUtils.isRegExp = function(o) {};
$do.objectUtils.isObject = function(o) {};

(function(){
    var uscope = $do.objectUtils,
        types = "Boolean Number String Function Array Date RegExp Object".split(" "),
        is = function (type, obj) {
            var clas = Object.prototype.toString.call(obj).slice(8, -1);
            return obj !== undefined && obj !== null && clas === type;
        };
    for(var i=0;i<types.length;i++)
        uscope['is'+types[i]] = (function( type ){
            return function( obj ){return is( type, obj )};
        }( types[i] ));
}());