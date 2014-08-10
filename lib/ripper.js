(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
var indexOf = require('indexof');

var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    forEach(Object_keys(ctx), function (key) {
        context[key] = ctx[key];
    });

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{"indexof":5}],5:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],6:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
var LocationDataUtil, Range;

Range = require('../vender/text-buffer/src/range').Range;

module.exports = LocationDataUtil = (function() {
  function LocationDataUtil() {}

  LocationDataUtil.locationDataToRange = function(_arg) {
    var first_column, first_line, last_column, last_line;
    first_line = _arg.first_line, first_column = _arg.first_column, last_line = _arg.last_line, last_column = _arg.last_column;
    if (last_line == null) {
      last_line = first_line;
    }
    if (last_column == null) {
      last_column = first_column;
    }
    return new Range([first_line, first_column], [last_line, last_column + 1]);
  };

  LocationDataUtil.rangeToLocationData = function(_arg) {
    var end, start;
    start = _arg.start, end = _arg.end;
    return {
      first_line: start.row,
      first_column: start.column,
      last_line: end.row,
      last_column: end.column - 1
    };
  };

  LocationDataUtil.isEqualsLocationData = function(a, b) {
    return a.first_line === b.first_line && a.first_column === b.first_column && a.last_line === b.last_line && a.last_column === b.last_column;
  };

  LocationDataUtil.isContains = function(_arg, _arg1) {
    var column, first_column, first_line, last_column, last_line, row;
    first_line = _arg.first_line, first_column = _arg.first_column, last_line = _arg.last_line, last_column = _arg.last_column;
    row = _arg1.row, column = _arg1.column;
    last_column++;
    if ((first_line === row && row === last_line)) {
      return (first_column <= column && column <= last_column);
    } else if ((first_line === row && row < last_line)) {
      return first_column <= column;
    } else if ((first_line < row && row === last_line)) {
      return column <= last_column;
    } else if ((first_line < row && row < last_line)) {
      return true;
    } else {
      return false;
    }
  };

  return LocationDataUtil;

})();



},{"../vender/text-buffer/src/range":20}],8:[function(require,module,exports){
var Access, Assign, Code, For, HEXNUM, LEVEL_TOP, Lexer, Literal, Parens, Range, Ripper, Value, bench, flatten, isArray, isContains, isEqualsLocationData, isString, locationDataToRange, nodes, parse, some, uniq, updateSyntaxError, _, _ref, _ref1, _ref2;

nodes = require('../vender/coffee-script/lib/coffee-script/coffee-script').nodes;

Lexer = require('../vender/coffee-script/lib/coffee-script/lexer').Lexer;

parse = require('../vender/coffee-script/lib/coffee-script/parser').parse;

updateSyntaxError = require('../vender/coffee-script/lib/coffee-script/helpers').updateSyntaxError;

_ref = require('../vender/coffee-script/lib/coffee-script/nodes'), Value = _ref.Value, Code = _ref.Code, Literal = _ref.Literal, For = _ref.For, Assign = _ref.Assign, Access = _ref.Access, Parens = _ref.Parens;

flatten = require('../vender/coffee-script/lib/coffee-script/helpers').flatten;

Range = require('../vender/text-buffer/src/range').Range;

_ref1 = _ = require('lodash'), isString = _ref1.isString, isArray = _ref1.isArray, uniq = _ref1.uniq, some = _ref1.some;

_ref2 = require('./location_data_util'), locationDataToRange = _ref2.locationDataToRange, isEqualsLocationData = _ref2.isEqualsLocationData, isContains = _ref2.isContains;

LEVEL_TOP = 1;

HEXNUM = /^[+-]?0x[\da-f]+/i;

Value.prototype.isHexNumber = function() {
  return this.bareLiteral(Literal) && HEXNUM.test(this.base.value);
};

bench = (function() {
  var prev;
  prev = 0;
  return function() {
    var current, past;
    current = new Date().getTime();
    past = current - prev;
    prev = current;
    return "" + past + "ms";
  };
})();

module.exports = Ripper = (function() {
  Ripper.find = function(tokens, nodes, point) {
    var target;
    if (!this.isIdentifier(tokens, point)) {
      return [];
    }
    target = this.findSymbol(nodes, point);
    if (target == null) {
      return [];
    }
    return this.findReference(nodes, target).data;
  };

  Ripper.isIdentifier = function(tokens, point) {
    var token, _i, _len;
    for (_i = 0, _len = tokens.length; _i < _len; _i++) {
      token = tokens[_i];
      if (token[0] === 'IDENTIFIER' && isContains(token[2], point)) {
        return true;
      }
    }
    return false;
  };

  Ripper.findSymbol = function(nodes, point) {
    var target;
    target = null;
    _.each(nodes._children, (function(_this) {
      return function(child) {
        if (target != null) {
          return false;
        }
        if (child.locationData == null) {
          return true;
        }
        if (_this.isPrimitive(child)) {
          return true;
        }
        if (_this.isKeyOfObjectAccess(nodes, child)) {
          return true;
        }
        if (_this.isKeyOfObjectLiteral(nodes, child)) {
          return true;
        }
        if (child instanceof Literal) {
          if (isContains(child.locationData, point)) {
            target = child;
            return false;
          }
        }
        target = _this.findSymbol(child, point);
        if (target != null) {
          return false;
        }
      };
    })(this));
    return target;
  };

  Ripper.findReference = function(parent, target, isDeclaredInParent) {
    var data, isFixed;
    if (isDeclaredInParent == null) {
      isDeclaredInParent = this.isDeclared(target, parent);
    }
    isFixed = false;
    data = [];
    _.each(parent._children, (function(_this) {
      return function(child) {
        var childRef, isDeclared;
        if (isFixed) {
          return false;
        }
        if (child instanceof Code) {
          isDeclared = _this.isDeclared(target, child, parent);
          childRef = _this.findReference(child, target, isDeclaredInParent || isDeclared);
          if (_this.hasTarget(childRef.data, target)) {
            if (childRef.isFixed || isDeclared) {
              data = childRef.data;
              isFixed = true;
              return false;
            }
            data = data.concat(childRef.data);
            return true;
          }
          if (isDeclared) {
            return true;
          }
          if (isDeclaredInParent) {
            data = data.concat(childRef.data);
            return true;
          }
          return true;
        }
        child.scope = parent.scope;
        if (_this.isKeyOfObjectAccess(parent, child)) {
          return true;
        }
        if (_this.isKeyOfObjectLiteral(parent, child)) {
          return true;
        }
        if (_this.isSameLiteral(child, target)) {
          data.push(child);
          return true;
        }
        if (child instanceof For) {
          if (_this.isSameLiteral(child.name, target)) {
            data.push(child.name);
          } else if (_this.isSameLiteral(child.index, target)) {
            data.push(child.index);
          }
        }
        childRef = _this.findReference(child, target, isDeclaredInParent);
        if (childRef.isFixed) {
          data = childRef.data;
          isFixed = true;
          return false;
        }
        data = data.concat(childRef.data);
        return true;
      };
    })(this));
    data = uniq(data);
    return {
      isFixed: isFixed,
      data: data
    };
  };

  Ripper.isDeclared = function(target, child, parent) {
    var err, o, symbols;
    try {
      if (child.scope == null) {
        o = {
          indent: ''
        };
        if (parent == null) {
          child.compileRoot(o);
        } else {
          o.scope = parent.scope;
          child.compileNode(o);
        }
        child.scope = o.scope;
      }
      symbols = this.declaredSymbols(child.scope);
      return symbols.indexOf(target.value) !== -1;
    } catch (_error) {
      err = _error;
    }
    return false;
  };

  Ripper.hasTarget = function(refs, target) {
    return some(refs, (function(_this) {
      return function(ref) {
        return isEqualsLocationData(ref.locationData, target.locationData) && _this.isSameLiteral(ref, target);
      };
    })(this));
  };

  Ripper.declaredSymbols = function(scope) {
    var name, type, _i, _len, _ref3, _ref4, _results;
    _ref3 = scope.variables;
    _results = [];
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      _ref4 = _ref3[_i], type = _ref4.type, name = _ref4.name;
      if (this.isScopedSymbol(type, name)) {
        _results.push(name);
      }
    }
    return _results;
  };

  Ripper.isScopedSymbol = function(type, name) {
    return (type === 'var' || type === 'param') && isString(name) && name.charAt(0) !== '_';
  };

  Ripper.isPrimitive = function(node) {
    return (typeof node.isString === "function" ? node.isString() : void 0) || (typeof node.isSimpleNumber === "function" ? node.isSimpleNumber() : void 0) || (typeof node.isHexNumber === "function" ? node.isHexNumber() : void 0) || (typeof node.isRegex === "function" ? node.isRegex() : void 0);
  };

  Ripper.isKeyOfObjectAccess = function(parent, child) {
    return parent.soak === false && child.asKey && child.unfoldedSoak !== false;
  };

  Ripper.isKeyOfObjectLiteral = function(parent, child) {
    return parent.context === 'object' && child === parent.variable && parent instanceof Assign && child instanceof Value;
  };

  Ripper.isSameLiteral = function(a, b) {
    return (a != null) && (b != null) && (a.locationData != null) && (b.locationData != null) && a instanceof Literal && b instanceof Literal && a.value === b.value;
  };

  Ripper.generateNodes = function(parent) {
    var attr, child, children, _i, _j, _len, _len1, _ref3;
    if (parent.children == null) {
      return;
    }
    children = [];
    if (parent.index != null) {
      children.push(parent.index);
    }
    if (parent.name != null) {
      children.push(parent.name);
    }
    _ref3 = parent.children;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      attr = _ref3[_i];
      if (parent[attr]) {
        children.push(parent[attr]);
      }
    }
    children = flatten(children);
    for (_j = 0, _len1 = children.length; _j < _len1; _j++) {
      child = children[_j];
      this.generateNodes(child);
    }
    parent._children = children;
    return parent;
  };

  Ripper.scopeNames = ['source.coffee', 'source.litcoffee'];

  function Ripper() {
    this.lexer = new Lexer;
  }

  Ripper.prototype.destruct = function() {
    delete this.lexer;
    delete this.tokens;
    return delete this.nodes;
  };

  Ripper.prototype.parse = function(code, callback) {
    var err, location, message;
    try {
      this.tokens = this.lexer.tokenize(code, {});
      this.nodes = Ripper.generateNodes(parse(this.tokens));
      return typeof callback === "function" ? callback() : void 0;
    } catch (_error) {
      err = _error;
      updateSyntaxError(err, code);
      location = err.location, message = err.message;
      if ((location != null) && (message != null)) {
        return typeof callback === "function" ? callback([
          {
            range: locationDataToRange(location),
            message: message
          }
        ]) : void 0;
      } else {
        console.warn(err);
        return typeof callback === "function" ? callback() : void 0;
      }
    }
  };

  Ripper.prototype.find = function(point) {
    var foundNodes, i, locationData, results;
    if (this.nodes == null) {
      return [];
    }
    foundNodes = Ripper.find(this.tokens, this.nodes, point);
    results = (function() {
      var _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = foundNodes.length; _i < _len; i = ++_i) {
        locationData = foundNodes[i].locationData;
        _results.push(locationDataToRange(locationData));
      }
      return _results;
    })();
    return results;
  };

  return Ripper;

})();



},{"../vender/coffee-script/lib/coffee-script/coffee-script":9,"../vender/coffee-script/lib/coffee-script/helpers":10,"../vender/coffee-script/lib/coffee-script/lexer":11,"../vender/coffee-script/lib/coffee-script/nodes":12,"../vender/coffee-script/lib/coffee-script/parser":13,"../vender/text-buffer/src/range":20,"./location_data_util":7,"lodash":6}],9:[function(require,module,exports){
(function (process,global){
// Generated by CoffeeScript 1.7.1
(function() {
  var Lexer, SourceMap, compile, ext, formatSourcePosition, fs, getSourceMap, helpers, lexer, parser, path, sourceMaps, vm, withPrettyErrors, _base, _i, _len, _ref,
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fs = require('fs');

  vm = require('vm');

  path = require('path');

  Lexer = require('./lexer').Lexer;

  parser = require('./parser').parser;

  helpers = require('./helpers');

  SourceMap = require('./sourcemap');

  exports.VERSION = '1.7.1';

  exports.FILE_EXTENSIONS = ['.coffee', '.litcoffee', '.coffee.md'];

  exports.helpers = helpers;

  withPrettyErrors = function(fn) {
    return function(code, options) {
      var err;
      if (options == null) {
        options = {};
      }
      try {
        return fn.call(this, code, options);
      } catch (_error) {
        err = _error;
        throw helpers.updateSyntaxError(err, code, options.filename);
      }
    };
  };

  exports.compile = compile = withPrettyErrors(function(code, options) {
    var answer, currentColumn, currentLine, extend, fragment, fragments, header, js, map, merge, newLines, _i, _len;
    merge = helpers.merge, extend = helpers.extend;
    options = extend({}, options);
    if (options.sourceMap) {
      map = new SourceMap;
    }
    fragments = parser.parse(lexer.tokenize(code, options)).compileToFragments(options);
    currentLine = 0;
    if (options.header) {
      currentLine += 1;
    }
    if (options.shiftLine) {
      currentLine += 1;
    }
    currentColumn = 0;
    js = "";
    for (_i = 0, _len = fragments.length; _i < _len; _i++) {
      fragment = fragments[_i];
      if (options.sourceMap) {
        if (fragment.locationData) {
          map.add([fragment.locationData.first_line, fragment.locationData.first_column], [currentLine, currentColumn], {
            noReplace: true
          });
        }
        newLines = helpers.count(fragment.code, "\n");
        currentLine += newLines;
        if (newLines) {
          currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1);
        } else {
          currentColumn += fragment.code.length;
        }
      }
      js += fragment.code;
    }
    if (options.header) {
      header = "Generated by CoffeeScript " + this.VERSION;
      js = "// " + header + "\n" + js;
    }
    if (options.sourceMap) {
      answer = {
        js: js
      };
      answer.sourceMap = map;
      answer.v3SourceMap = map.generate(options, code);
      return answer;
    } else {
      return js;
    }
  });

  exports.tokens = withPrettyErrors(function(code, options) {
    return lexer.tokenize(code, options);
  });

  exports.nodes = withPrettyErrors(function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  });

  exports.run = function(code, options) {
    var answer, dir, mainModule, _ref;
    if (options == null) {
      options = {};
    }
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '.';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    dir = options.filename ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
    mainModule.paths = require('module')._nodeModulePaths(dir);
    if (!helpers.isCoffee(mainModule.filename) || require.extensions) {
      answer = compile(code, options);
      code = (_ref = answer.js) != null ? _ref : answer;
    }
    return mainModule._compile(code, mainModule.filename);
  };

  exports["eval"] = function(code, options) {
    var Module, Script, js, k, o, r, sandbox, v, _i, _len, _module, _ref, _ref1, _require;
    if (options == null) {
      options = {};
    }
    if (!(code = code.trim())) {
      return;
    }
    Script = vm.Script;
    if (Script) {
      if (options.sandbox != null) {
        if (options.sandbox instanceof Script.createContext().constructor) {
          sandbox = options.sandbox;
        } else {
          sandbox = Script.createContext();
          _ref = options.sandbox;
          for (k in _ref) {
            if (!__hasProp.call(_ref, k)) continue;
            v = _ref[k];
            sandbox[k] = v;
          }
        }
        sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
      } else {
        sandbox = global;
      }
      sandbox.__filename = options.filename || 'eval';
      sandbox.__dirname = path.dirname(sandbox.__filename);
      if (!(sandbox !== global || sandbox.module || sandbox.require)) {
        Module = require('module');
        sandbox.module = _module = new Module(options.modulename || 'eval');
        sandbox.require = _require = function(path) {
          return Module._load(path, _module, true);
        };
        _module.filename = sandbox.__filename;
        _ref1 = Object.getOwnPropertyNames(require);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          if (r !== 'paths') {
            _require[r] = require[r];
          }
        }
        _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
        _require.resolve = function(request) {
          return Module._resolveFilename(request, _module);
        };
      }
    }
    o = {};
    for (k in options) {
      if (!__hasProp.call(options, k)) continue;
      v = options[k];
      o[k] = v;
    }
    o.bare = true;
    js = compile(code, o);
    if (sandbox === global) {
      return vm.runInThisContext(js);
    } else {
      return vm.runInContext(js, sandbox);
    }
  };

  exports.register = function() {
    return require('./register');
  };

  if (require.extensions) {
    _ref = this.FILE_EXTENSIONS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ext = _ref[_i];
      if ((_base = require.extensions)[ext] == null) {
        _base[ext] = function() {
          throw new Error("Use CoffeeScript.register() or require the coffee-script/register module to require " + ext + " files.");
        };
      }
    }
  }

  exports._compileFile = function(filename, sourceMap) {
    var answer, err, raw, stripped;
    if (sourceMap == null) {
      sourceMap = false;
    }
    raw = fs.readFileSync(filename, 'utf8');
    stripped = raw.charCodeAt(0) === 0xFEFF ? raw.substring(1) : raw;
    try {
      answer = compile(stripped, {
        filename: filename,
        sourceMap: sourceMap,
        literate: helpers.isLiterate(filename)
      });
    } catch (_error) {
      err = _error;
      throw helpers.updateSyntaxError(err, stripped, filename);
    }
    return answer;
  };

  lexer = new Lexer;

  parser.lexer = {
    lex: function() {
      var tag, token;
      token = this.tokens[this.pos++];
      if (token) {
        tag = token[0], this.yytext = token[1], this.yylloc = token[2];
        this.errorToken = token.origin || token;
        this.yylineno = this.yylloc.first_line;
      } else {
        tag = '';
      }
      return tag;
    },
    setInput: function(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };

  parser.yy = require('./nodes');

  parser.yy.parseError = function(message, _arg) {
    var errorLoc, errorTag, errorText, errorToken, token, tokens, _ref1;
    token = _arg.token;
    _ref1 = parser.lexer, errorToken = _ref1.errorToken, tokens = _ref1.tokens;
    errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
    errorText = errorToken === tokens[tokens.length - 1] ? 'end of input' : errorTag === 'INDENT' || errorTag === 'OUTDENT' ? 'indentation' : helpers.nameWhitespaceCharacter(errorText);
    return helpers.throwSyntaxError("unexpected " + errorText, errorLoc);
  };

  formatSourcePosition = function(frame, getSourceMapping) {
    var as, column, fileLocation, fileName, functionName, isConstructor, isMethodCall, line, methodName, source, tp, typeName;
    fileName = void 0;
    fileLocation = '';
    if (frame.isNative()) {
      fileLocation = "native";
    } else {
      if (frame.isEval()) {
        fileName = frame.getScriptNameOrSourceURL();
        if (!fileName) {
          fileLocation = "" + (frame.getEvalOrigin()) + ", ";
        }
      } else {
        fileName = frame.getFileName();
      }
      fileName || (fileName = "<anonymous>");
      line = frame.getLineNumber();
      column = frame.getColumnNumber();
      source = getSourceMapping(fileName, line, column);
      fileLocation = source ? "" + fileName + ":" + source[0] + ":" + source[1] : "" + fileName + ":" + line + ":" + column;
    }
    functionName = frame.getFunctionName();
    isConstructor = frame.isConstructor();
    isMethodCall = !(frame.isToplevel() || isConstructor);
    if (isMethodCall) {
      methodName = frame.getMethodName();
      typeName = frame.getTypeName();
      if (functionName) {
        tp = as = '';
        if (typeName && functionName.indexOf(typeName)) {
          tp = "" + typeName + ".";
        }
        if (methodName && functionName.indexOf("." + methodName) !== functionName.length - methodName.length - 1) {
          as = " [as " + methodName + "]";
        }
        return "" + tp + functionName + as + " (" + fileLocation + ")";
      } else {
        return "" + typeName + "." + (methodName || '<anonymous>') + " (" + fileLocation + ")";
      }
    } else if (isConstructor) {
      return "new " + (functionName || '<anonymous>') + " (" + fileLocation + ")";
    } else if (functionName) {
      return "" + functionName + " (" + fileLocation + ")";
    } else {
      return fileLocation;
    }
  };

  sourceMaps = {};

  getSourceMap = function(filename) {
    var answer, _ref1;
    if (sourceMaps[filename]) {
      return sourceMaps[filename];
    }
    if (_ref1 = path != null ? path.extname(filename) : void 0, __indexOf.call(exports.FILE_EXTENSIONS, _ref1) < 0) {
      return;
    }
    answer = exports._compileFile(filename, true);
    return sourceMaps[filename] = answer.sourceMap;
  };

  Error.prepareStackTrace = function(err, stack) {
    var frame, frames, getSourceMapping;
    getSourceMapping = function(filename, line, column) {
      var answer, sourceMap;
      sourceMap = getSourceMap(filename);
      if (sourceMap) {
        answer = sourceMap.sourceLocation([line - 1, column - 1]);
      }
      if (answer) {
        return [answer[0] + 1, answer[1] + 1];
      } else {
        return null;
      }
    };
    frames = (function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = stack.length; _j < _len1; _j++) {
        frame = stack[_j];
        if (frame.getFunction() === exports.run) {
          break;
        }
        _results.push("  at " + (formatSourcePosition(frame, getSourceMapping)));
      }
      return _results;
    })();
    return "" + (err.toString()) + "\n" + (frames.join('\n')) + "\n";
  };

}).call(this);

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./helpers":10,"./lexer":11,"./nodes":12,"./parser":13,"./register":14,"./sourcemap":17,"1YiZ5S":3,"fs":1,"module":1,"path":2,"vm":4}],10:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var buildLocationData, extend, flatten, last, repeat, syntaxErrorToString, _ref;

  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };

  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };

  exports.repeat = repeat = function(str, n) {
    var res;
    res = '';
    while (n > 0) {
      if (n & 1) {
        res += str;
      }
      n >>>= 1;
      str += str;
    }
    return res;
  };

  exports.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };

  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };

  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };

  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  exports.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };

  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };

  exports.last = last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };

  exports.some = (_ref = Array.prototype.some) != null ? _ref : function(fn) {
    var e, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      e = this[_i];
      if (fn(e)) {
        return true;
      }
    }
    return false;
  };

  exports.invertLiterate = function(code) {
    var line, lines, maybe_code;
    maybe_code = true;
    lines = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = code.split('\n');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        line = _ref1[_i];
        if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
          _results.push(line);
        } else if (maybe_code = /^\s*$/.test(line)) {
          _results.push(line);
        } else {
          _results.push('# ' + line);
        }
      }
      return _results;
    })();
    return lines.join('\n');
  };

  buildLocationData = function(first, last) {
    if (!last) {
      return first;
    } else {
      return {
        first_line: first.first_line,
        first_column: first.first_column,
        last_line: last.last_line,
        last_column: last.last_column
      };
    }
  };

  exports.addLocationDataFn = function(first, last) {
    return function(obj) {
      if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
        obj.updateLocationDataIfMissing(buildLocationData(first, last));
      }
      return obj;
    };
  };

  exports.locationDataToString = function(obj) {
    var locationData;
    if (("2" in obj) && ("first_line" in obj[2])) {
      locationData = obj[2];
    } else if ("first_line" in obj) {
      locationData = obj;
    }
    if (locationData) {
      return ("" + (locationData.first_line + 1) + ":" + (locationData.first_column + 1) + "-") + ("" + (locationData.last_line + 1) + ":" + (locationData.last_column + 1));
    } else {
      return "No location data";
    }
  };

  exports.baseFileName = function(file, stripExt, useWinPathSep) {
    var parts, pathSep;
    if (stripExt == null) {
      stripExt = false;
    }
    if (useWinPathSep == null) {
      useWinPathSep = false;
    }
    pathSep = useWinPathSep ? /\\|\// : /\//;
    parts = file.split(pathSep);
    file = parts[parts.length - 1];
    if (!(stripExt && file.indexOf('.') >= 0)) {
      return file;
    }
    parts = file.split('.');
    parts.pop();
    if (parts[parts.length - 1] === 'coffee' && parts.length > 1) {
      parts.pop();
    }
    return parts.join('.');
  };

  exports.isCoffee = function(file) {
    return /\.((lit)?coffee|coffee\.md)$/.test(file);
  };

  exports.isLiterate = function(file) {
    return /\.(litcoffee|coffee\.md)$/.test(file);
  };

  exports.throwSyntaxError = function(message, location) {
    var error;
    error = new SyntaxError(message);
    error.location = location;
    error.toString = syntaxErrorToString;
    error.stack = error.toString();
    throw error;
  };

  exports.updateSyntaxError = function(error, code, filename) {
    if (error.toString === syntaxErrorToString) {
      error.code || (error.code = code);
      error.filename || (error.filename = filename);
      error.stack = error.toString();
    }
    return error;
  };

  syntaxErrorToString = function() {
    var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, start, _ref1, _ref2;
    if (!(this.code && this.location)) {
      return Error.prototype.toString.call(this);
    }
    _ref1 = this.location, first_line = _ref1.first_line, first_column = _ref1.first_column, last_line = _ref1.last_line, last_column = _ref1.last_column;
    if (last_line == null) {
      last_line = first_line;
    }
    if (last_column == null) {
      last_column = first_column;
    }
    filename = this.filename || '[stdin]';
    codeLine = this.code.split('\n')[first_line];
    start = first_column;
    end = first_line === last_line ? last_column + 1 : codeLine.length;
    marker = repeat(' ', start) + repeat('^', end - start);
    if (typeof process !== "undefined" && process !== null) {
      colorsEnabled = process.stdout.isTTY && !process.env.NODE_DISABLE_COLORS;
    }
    if ((_ref2 = this.colorful) != null ? _ref2 : colorsEnabled) {
      colorize = function(str) {
        return "\x1B[1;31m" + str + "\x1B[0m";
      };
      codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
      marker = colorize(marker);
    }
    return "" + filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
  };

  exports.nameWhitespaceCharacter = function(string) {
    switch (string) {
      case ' ':
        return 'space';
      case '\n':
        return 'newline';
      case '\r':
        return 'carriage return';
      case '\t':
        return 'tab';
      default:
        return string;
    }
  };

}).call(this);

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, INVERSES, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, STRICT_PROSCRIBED, TRAILING_SPACES, UNARY, UNARY_MATH, WHITESPACE, compact, count, invertLiterate, key, last, locationDataToString, repeat, starts, throwSyntaxError, _ref, _ref1,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('./rewriter'), Rewriter = _ref.Rewriter, INVERSES = _ref.INVERSES;

  _ref1 = require('./helpers'), count = _ref1.count, starts = _ref1.starts, compact = _ref1.compact, last = _ref1.last, repeat = _ref1.repeat, invertLiterate = _ref1.invertLiterate, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

  exports.Lexer = Lexer = (function() {
    function Lexer() {}

    Lexer.prototype.tokenize = function(code, opts) {
      var consumed, i, tag, _ref2;
      if (opts == null) {
        opts = {};
      }
      this.literate = opts.literate;
      this.indent = 0;
      this.baseIndent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.ends = [];
      this.tokens = [];
      this.chunkLine = opts.line || 0;
      this.chunkColumn = opts.column || 0;
      code = this.clean(code);
      i = 0;
      while (this.chunk = code.slice(i)) {
        consumed = this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
        _ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = _ref2[0], this.chunkColumn = _ref2[1];
        i += consumed;
      }
      this.closeIndentation();
      if (tag = this.ends.pop()) {
        this.error("missing " + tag);
      }
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    };

    Lexer.prototype.clean = function(code) {
      if (code.charCodeAt(0) === BOM) {
        code = code.slice(1);
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
        this.chunkLine--;
      }
      if (this.literate) {
        code = invertLiterate(code);
      }
      return code;
    };

    Lexer.prototype.identifierToken = function() {
      var colon, colonOffset, forcedIdentifier, id, idLength, input, match, poppedToken, prev, tag, tagToken, _ref2, _ref3, _ref4;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      idLength = id.length;
      poppedToken = void 0;
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::' || _ref2 === '?::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              poppedToken = this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.error("reserved word \"" + id + "\"");
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
              return 'BOOL';
            case 'break':
            case 'continue':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      tagToken = this.token(tag, id, 0, idLength);
      if (poppedToken) {
        _ref4 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = _ref4[0], tagToken[2].first_column = _ref4[1];
      }
      if (colon) {
        colonOffset = input.lastIndexOf(':');
        this.token(':', ':', colonOffset, colon.length);
      }
      return input.length;
    };

    Lexer.prototype.numberToken = function() {
      var binaryLiteral, lexedLength, match, number, octalLiteral;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      if (/^0[BOX]/.test(number)) {
        this.error("radix prefix '" + number + "' must be lowercase");
      } else if (/E/.test(number) && !/^0x/.test(number)) {
        this.error("exponential notation '" + number + "' must be indicated with a lowercase 'e'");
      } else if (/^0\d*[89]/.test(number)) {
        this.error("decimal literal '" + number + "' must not be prefixed with '0'");
      } else if (/^0\d+/.test(number)) {
        this.error("octal literal '" + number + "' must be prefixed with '0o'");
      }
      lexedLength = number.length;
      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
        number = '0x' + parseInt(octalLiteral[1], 8).toString(16);
      }
      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
        number = '0x' + parseInt(binaryLiteral[1], 2).toString(16);
      }
      this.token('NUMBER', number, 0, lexedLength);
      return lexedLength;
    };

    Lexer.prototype.stringToken = function() {
      var inner, match, octalEsc, quote, strOffset, string, trimmed;
      switch (quote = this.chunk.charAt(0)) {
        case "'":
          string = (SIMPLESTR.exec(this.chunk) || [])[0];
          break;
        case '"':
          string = this.balancedString(this.chunk, '"');
      }
      if (!string) {
        return 0;
      }
      inner = string.slice(1, -1);
      trimmed = this.removeNewlines(inner);
      if (quote === '"' && 0 < string.indexOf('#{', 1)) {
        strOffset = (match = inner.match(/^\n+[\n ]*|^[ ]+\n+[\n ]+/)) != null ? match[0].length : 0;
        this.interpolateString(trimmed, {
          strOffset: 1 + strOffset,
          lexedLength: string.length
        });
      } else {
        this.token('STRING', quote + this.escapeLines(trimmed) + quote, 0, string.length);
      }
      if (octalEsc = /^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(string)) {
        this.error("octal escape sequences " + string + " are not allowed");
      }
      return string.length;
    };

    Lexer.prototype.heredocToken = function() {
      var doc, heredoc, match, quote, strOffset;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        strOffset = (match = match[2].match(/^\n+([ ]*)/)) != null ? 1 + match[1].length : 0;
        this.interpolateString(doc, {
          heredoc: true,
          strOffset: 3 + strOffset,
          lexedLength: heredoc.length
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true), 0, heredoc.length);
      }
      return heredoc.length;
    };

    Lexer.prototype.commentToken = function() {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: repeat(' ', this.indent)
        }), 0, comment.length);
      }
      return comment.length;
    };

    Lexer.prototype.jsToken = function() {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1), 0, script.length);
      return script.length;
    };

    Lexer.prototype.regexToken = function() {
      var flags, length, match, prev, regex, _ref2, _ref3;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (length = this.heregexToken()) {
        return length;
      }
      prev = last(this.tokens);
      if (prev && (_ref2 = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref2) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      _ref3 = match, match = _ref3[0], regex = _ref3[1], flags = _ref3[2];
      if (regex === '//') {
        return 0;
      }
      if (regex.slice(0, 2) === '/*') {
        this.error('regular expressions cannot begin with `*`');
      }
      this.token('REGEX', "" + regex + flags, 0, match.length);
      return match.length;
    };

    Lexer.prototype.heregexToken = function() {
      var body, flags, flagsOffset, heregex, match, plusToken, prev, re, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
      if (!(match = HEREGEX.exec(this.chunk))) {
        return 0;
      }
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = this.escapeLines(body.replace(HEREGEX_OMIT, '$1$2').replace(/\//g, '\\/'), true);
        if (re.match(/^\*/)) {
          this.error('regular expressions cannot begin with `*`');
        }
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags, 0, heregex.length);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp', 0, 0);
      this.token('CALL_START', '(', 0, 0);
      tokens = [];
      _ref2 = this.interpolateString(body, {
        regex: true,
        strOffset: 3
      });
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        token = _ref2[_i];
        tag = token[0], value = token[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else if (tag === 'NEOSTRING') {
          if (!(value = value.replace(HEREGEX_OMIT, '$1$2'))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          token[0] = 'STRING';
          token[1] = this.makeString(value, '"', true);
          tokens.push(token);
        } else {
          this.error("Unexpected " + tag);
        }
        prev = last(this.tokens);
        plusToken = ['+', '+'];
        plusToken[2] = prev[2];
        tokens.push(plusToken);
      }
      tokens.pop();
      if (((_ref3 = tokens[0]) != null ? _ref3[0] : void 0) !== 'STRING') {
        this.token('STRING', '""', 0, 0);
        this.token('+', '+', 0, 0);
      }
      (_ref4 = this.tokens).push.apply(_ref4, tokens);
      if (flags) {
        flagsOffset = heregex.lastIndexOf(flags);
        this.token(',', ',', flagsOffset, 0);
        this.token('STRING', '"' + flags + '"', flagsOffset, flags.length);
      }
      this.token(')', ')', heregex.length - 1, 0);
      return heregex.length;
    };

    Lexer.prototype.lineToken = function() {
      var diff, indent, match, noNewlines, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.seenFor = false;
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken(0);
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        if (!this.tokens.length) {
          this.baseIndent = this.indent = size;
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff, indent.length - size, size);
        this.indents.push(diff);
        this.ends.push('OUTDENT');
        this.outdebt = this.indebt = 0;
        this.indent = size;
      } else if (size < this.baseIndent) {
        this.error('missing indentation', indent.length);
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines, indent.length);
      }
      return indent.length;
    };

    Lexer.prototype.outdentToken = function(moveOut, noNewlines, outdentLength) {
      var decreasedIndent, dent, lastIndent, _ref2;
      decreasedIndent = this.indent - moveOut;
      while (moveOut > 0) {
        lastIndent = this.indents[this.indents.length - 1];
        if (!lastIndent) {
          moveOut = 0;
        } else if (lastIndent === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (lastIndent < this.outdebt) {
          this.outdebt -= lastIndent;
          moveOut -= lastIndent;
        } else {
          dent = this.indents.pop() + this.outdebt;
          if (outdentLength && (_ref2 = this.chunk[outdentLength], __indexOf.call(INDENTABLE_CLOSERS, _ref2) >= 0)) {
            decreasedIndent -= dent - moveOut;
            moveOut = dent;
          }
          this.outdebt = 0;
          this.pair('OUTDENT');
          this.token('OUTDENT', moveOut, 0, outdentLength);
          moveOut -= dent;
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n', outdentLength, 0);
      }
      this.indent = decreasedIndent;
      return this;
    };

    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };

    Lexer.prototype.newlineToken = function(offset) {
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n', offset, 0);
      }
      return this;
    };

    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };

    Lexer.prototype.literalToken = function() {
      var match, prev, tag, value, _ref2, _ref3, _ref4, _ref5;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.error("reserved word \"" + (this.value()) + "\" can't be assigned");
        }
        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        this.seenFor = false;
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(UNARY_MATH, value) >= 0) {
        tag = 'UNARY_MATH';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
          }
        }
      }
      switch (value) {
        case '(':
        case '{':
        case '[':
          this.ends.push(INVERSES[value]);
          break;
        case ')':
        case '}':
        case ']':
          this.pair(value);
      }
      this.token(tag, value);
      return value.length;
    };

    Lexer.prototype.sanitizeHeredoc = function(doc, options) {
      var attempt, herecomment, indent, match, _ref2;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment) {
        if (HEREDOC_ILLEGAL.test(doc)) {
          this.error("block comment cannot contain \"*/\", starting");
        }
        if (doc.indexOf('\n') < 0) {
          return doc;
        }
      } else {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (_ref2 = attempt.length) && _ref2 < indent.length)) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    };

    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    };

    Lexer.prototype.closeIndentation = function() {
      return this.outdentToken(this.indent);
    };

    Lexer.prototype.balancedString = function(str, end) {
      var continueCount, i, letter, match, prev, stack, _i, _ref2;
      continueCount = 0;
      stack = [end];
      for (i = _i = 1, _ref2 = str.length; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
        if (continueCount) {
          --continueCount;
          continue;
        }
        switch (letter = str.charAt(i)) {
          case '\\':
            ++continueCount;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, +i + 1 || 9e9);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
          continueCount += match[0].length - 1;
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      return this.error("missing " + (stack.pop()) + ", starting");
    };

    Lexer.prototype.interpolateString = function(str, options) {
      var column, errorToken, expr, heredoc, i, inner, interpolated, len, letter, lexedLength, line, locationToken, nested, offsetInChunk, pi, plusToken, popped, regex, rparen, strOffset, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex, offsetInChunk = options.offsetInChunk, strOffset = options.strOffset, lexedLength = options.lexedLength;
      offsetInChunk || (offsetInChunk = 0);
      strOffset || (strOffset = 0);
      lexedLength || (lexedLength = str.length);
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(this.makeToken('NEOSTRING', str.slice(pi, i), strOffset + pi));
        }
        if (!errorToken) {
          errorToken = this.makeToken('', 'string interpolation', offsetInChunk + i + 1, 2);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          _ref2 = this.getLineAndColumnFromChunk(strOffset + i + 2), line = _ref2[0], column = _ref2[1];
          nested = new Lexer().tokenize(inner, {
            line: line,
            column: column,
            rewrite: false
          });
          popped = nested.pop();
          if (((_ref3 = nested[0]) != null ? _ref3[0] : void 0) === 'TERMINATOR') {
            popped = nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(this.makeToken('(', '(', strOffset + i + 1, 0));
              nested.push(this.makeToken(')', ')', strOffset + i + 1 + inner.length, 0));
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(this.makeToken('NEOSTRING', str.slice(pi), strOffset + pi));
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""', offsetInChunk, lexedLength);
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(this.makeToken('NEOSTRING', '', offsetInChunk));
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(', offsetInChunk, 0, errorToken);
      }
      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
        token = tokens[i];
        tag = token[0], value = token[1];
        if (i) {
          if (i) {
            plusToken = this.token('+', '+');
          }
          locationToken = tag === 'TOKENS' ? value[0] : token;
          plusToken[2] = {
            first_line: locationToken[2].first_line,
            first_column: locationToken[2].first_column,
            last_line: locationToken[2].first_line,
            last_column: locationToken[2].first_column
          };
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else if (tag === 'NEOSTRING') {
          token[0] = 'STRING';
          token[1] = this.makeString(value, '"', heredoc);
          this.tokens.push(token);
        } else {
          this.error("Unexpected " + tag);
        }
      }
      if (interpolated) {
        rparen = this.makeToken(')', ')', offsetInChunk + lexedLength, 0);
        rparen.stringEnd = true;
        this.tokens.push(rparen);
      }
      return tokens;
    };

    Lexer.prototype.pair = function(tag) {
      var wanted;
      if (tag !== (wanted = last(this.ends))) {
        if ('OUTDENT' !== wanted) {
          this.error("unmatched " + tag);
        }
        this.outdentToken(last(this.indents), true);
        return this.pair(tag);
      }
      return this.ends.pop();
    };

    Lexer.prototype.getLineAndColumnFromChunk = function(offset) {
      var column, lineCount, lines, string;
      if (offset === 0) {
        return [this.chunkLine, this.chunkColumn];
      }
      if (offset >= this.chunk.length) {
        string = this.chunk;
      } else {
        string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9);
      }
      lineCount = count(string, '\n');
      column = this.chunkColumn;
      if (lineCount > 0) {
        lines = string.split('\n');
        column = last(lines).length;
      } else {
        column += string.length;
      }
      return [this.chunkLine + lineCount, column];
    };

    Lexer.prototype.makeToken = function(tag, value, offsetInChunk, length) {
      var lastCharacter, locationData, token, _ref2, _ref3;
      if (offsetInChunk == null) {
        offsetInChunk = 0;
      }
      if (length == null) {
        length = value.length;
      }
      locationData = {};
      _ref2 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = _ref2[0], locationData.first_column = _ref2[1];
      lastCharacter = Math.max(0, length - 1);
      _ref3 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = _ref3[0], locationData.last_column = _ref3[1];
      token = [tag, value, locationData];
      return token;
    };

    Lexer.prototype.token = function(tag, value, offsetInChunk, length, origin) {
      var token;
      token = this.makeToken(tag, value, offsetInChunk, length);
      if (origin) {
        token.origin = origin;
      }
      this.tokens.push(token);
      return token;
    };

    Lexer.prototype.tag = function(index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };

    Lexer.prototype.value = function(index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };

    Lexer.prototype.unfinished = function() {
      var _ref2;
      return LINE_CONTINUER.test(this.chunk) || ((_ref2 = this.tag()) === '\\' || _ref2 === '.' || _ref2 === '?.' || _ref2 === '?::' || _ref2 === 'UNARY' || _ref2 === 'MATH' || _ref2 === 'UNARY_MATH' || _ref2 === '+' || _ref2 === '-' || _ref2 === '**' || _ref2 === 'SHIFT' || _ref2 === 'RELATION' || _ref2 === 'COMPARE' || _ref2 === 'LOGIC' || _ref2 === 'THROW' || _ref2 === 'EXTENDS');
    };

    Lexer.prototype.removeNewlines = function(str) {
      return str.replace(/^\s*\n\s*/, '').replace(/([^\\]|\\\\)\s*\n\s*$/, '$1');
    };

    Lexer.prototype.escapeLines = function(str, heredoc) {
      str = str.replace(/\\[^\S\n]*(\n|\\)\s*/g, function(escaped, character) {
        if (character === '\n') {
          return '';
        } else {
          return escaped;
        }
      });
      if (heredoc) {
        return str.replace(MULTILINER, '\\n');
      } else {
        return str.replace(/\s*\n\s*/g, ' ');
      }
    };

    Lexer.prototype.makeString = function(body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(RegExp("\\\\(" + quote + "|\\\\)", "g"), function(match, contents) {
        if (contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };

    Lexer.prototype.error = function(message, offset) {
      var first_column, first_line, _ref2;
      if (offset == null) {
        offset = 0;
      }
      _ref2 = this.getLineAndColumnFromChunk(offset), first_line = _ref2[0], first_column = _ref2[1];
      return throwSyntaxError(message, {
        first_line: first_line,
        first_column: first_column
      });
    };

    return Lexer;

  })();

  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];

  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };

  COFFEE_ALIASES = (function() {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  })();

  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];

  STRICT_PROSCRIBED = ['arguments', 'eval'];

  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);

  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;

  BOM = 65279;

  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;

  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

  HEREDOC = /^("""|''')((?:\\[\s\S]|[^\\])*?)(?:\n[^\n\S]*)?\1/;

  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>*\/%])\2=?|\?(\.|::)|\.{2,3})/;

  WHITESPACE = /^[^\n\S]+/;

  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

  CODE = /^[-=]>/;

  MULTI_DENT = /^(?:\n[^\n\S]*)+/;

  SIMPLESTR = /^'[^\\']*(?:\\[\s\S][^\\']*)*'/;

  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;

  REGEX = /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/;

  HEREGEX = /^\/{3}((?:\\?[\s\S])+?)\/{3}([imgy]{0,4})(?!\w)/;

  HEREGEX_OMIT = /((?:\\\\)+)|\\(\s|\/)|\s+(?:#.*)?/g;

  MULTILINER = /\n/g;

  HEREDOC_INDENT = /\n+([^\n\S]*)/g;

  HEREDOC_ILLEGAL = /\*\//;

  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

  TRAILING_SPACES = /\s+$/;

  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '**=', '//=', '%%='];

  UNARY = ['NEW', 'TYPEOF', 'DELETE', 'DO'];

  UNARY_MATH = ['!', '~'];

  LOGIC = ['&&', '||', '&', '|', '^'];

  SHIFT = ['<<', '>>', '>>>'];

  COMPARE = ['==', '!=', '<', '>', '<=', '>='];

  MATH = ['*', '/', '%', '//', '%%'];

  RELATION = ['IN', 'OF', 'INSTANCEOF'];

  BOOL = ['TRUE', 'FALSE'];

  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', 'NULL', 'UNDEFINED', '++', '--'];

  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING', ']');

  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];

  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL', 'NULL', 'UNDEFINED');

  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];

  INDENTABLE_CLOSERS = [')', '}', ']'];

}).call(this);

},{"./helpers":10,"./rewriter":15}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var Access, Arr, Assign, Base, Block, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, Extends, For, HEXNUM, IDENTIFIER, IDENTIFIER_STR, IS_REGEX, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, METHOD_DEF, NEGATE, NO, NUMBER, Obj, Op, Param, Parens, RESERVED, Range, Return, SIMPLENUM, STRICT_PROSCRIBED, Scope, Slice, Splat, Switch, TAB, THIS, Throw, Try, UTILITIES, Value, While, YES, addLocationDataFn, compact, del, ends, extend, flatten, fragmentsToText, isLiteralArguments, isLiteralThis, last, locationDataToString, merge, multident, parseNum, some, starts, throwSyntaxError, unfoldSoak, utility, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  Error.stackTraceLimit = Infinity;

  Scope = require('./scope').Scope;

  _ref = require('./lexer'), RESERVED = _ref.RESERVED, STRICT_PROSCRIBED = _ref.STRICT_PROSCRIBED;

  _ref1 = require('./helpers'), compact = _ref1.compact, flatten = _ref1.flatten, extend = _ref1.extend, merge = _ref1.merge, del = _ref1.del, starts = _ref1.starts, ends = _ref1.ends, last = _ref1.last, some = _ref1.some, addLocationDataFn = _ref1.addLocationDataFn, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

  exports.extend = extend;

  exports.addLocationDataFn = addLocationDataFn;

  YES = function() {
    return true;
  };

  NO = function() {
    return false;
  };

  THIS = function() {
    return this;
  };

  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };

  exports.CodeFragment = CodeFragment = (function() {
    function CodeFragment(parent, code) {
      var _ref2;
      this.code = "" + code;
      this.locationData = parent != null ? parent.locationData : void 0;
      this.type = (parent != null ? (_ref2 = parent.constructor) != null ? _ref2.name : void 0 : void 0) || 'unknown';
    }

    CodeFragment.prototype.toString = function() {
      return "" + this.code + (this.locationData ? ": " + locationDataToString(this.locationData) : '');
    };

    return CodeFragment;

  })();

  fragmentsToText = function(fragments) {
    var fragment;
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fragments.length; _i < _len; _i++) {
        fragment = fragments[_i];
        _results.push(fragment.code);
      }
      return _results;
    })()).join('');
  };

  exports.Base = Base = (function() {
    function Base() {}

    Base.prototype.compile = function(o, lvl) {
      return fragmentsToText(this.compileToFragments(o, lvl));
    };

    Base.prototype.compileToFragments = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };

    Base.prototype.compileClosure = function(o) {
      var args, argumentsNode, func, jumpNode, meth;
      if (jumpNode = this.jumps()) {
        jumpNode.error('cannot use a pure statement in an expression');
      }
      o.sharedScope = true;
      func = new Code([], Block.wrap([this]));
      args = [];
      if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
        args = [new Literal('this')];
        if (argumentsNode) {
          meth = 'apply';
          args.push(new Literal('arguments'));
        } else {
          meth = 'call';
        }
        func = new Value(func, [new Access(new Literal(meth))]);
      }
      return (new Call(func, args)).compileNode(o);
    };

    Base.prototype.cache = function(o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compileToFragments(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
        } else {
          return [sub, ref];
        }
      }
    };

    Base.prototype.cacheToCodeFragments = function(cacheValues) {
      return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
    };

    Base.prototype.makeReturn = function(res) {
      var me;
      me = this.unwrapAll();
      if (res) {
        return new Call(new Literal("" + res + ".push"), [me]);
      } else {
        return new Return(me);
      }
    };

    Base.prototype.contains = function(pred) {
      var node;
      node = void 0;
      this.traverseChildren(false, function(n) {
        if (pred(n)) {
          node = n;
          return false;
        }
      });
      return node;
    };

    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };

    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };

    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len1, _ref2, _ref3;
      if (!this.children) {
        return this;
      }
      _ref2 = this.children;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        attr = _ref2[_i];
        if (this[attr]) {
          _ref3 = flatten([this[attr]]);
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            child = _ref3[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };

    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        var recur;
        recur = func(child);
        if (recur !== false) {
          return child.traverseChildren(crossScope, func);
        }
      });
    };

    Base.prototype.invert = function() {
      return new Op('!', this);
    };

    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };

    Base.prototype.children = [];

    Base.prototype.isStatement = NO;

    Base.prototype.jumps = NO;

    Base.prototype.isComplex = YES;

    Base.prototype.isChainable = NO;

    Base.prototype.isAssignable = NO;

    Base.prototype.unwrap = THIS;

    Base.prototype.unfoldSoak = NO;

    Base.prototype.assigns = NO;

    Base.prototype.updateLocationDataIfMissing = function(locationData) {
      if (this.locationData) {
        return this;
      }
      this.locationData = locationData;
      return this.eachChild(function(child) {
        return child.updateLocationDataIfMissing(locationData);
      });
    };

    Base.prototype.error = function(message) {
      return throwSyntaxError(message, this.locationData);
    };

    Base.prototype.makeCode = function(code) {
      return new CodeFragment(this, code);
    };

    Base.prototype.wrapInBraces = function(fragments) {
      return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
    };

    Base.prototype.joinFragmentArrays = function(fragmentsList, joinStr) {
      var answer, fragments, i, _i, _len;
      answer = [];
      for (i = _i = 0, _len = fragmentsList.length; _i < _len; i = ++_i) {
        fragments = fragmentsList[i];
        if (i) {
          answer.push(this.makeCode(joinStr));
        }
        answer = answer.concat(fragments);
      }
      return answer;
    };

    return Base;

  })();

  exports.Block = Block = (function(_super) {
    __extends(Block, _super);

    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }

    Block.prototype.children = ['expressions'];

    Block.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };

    Block.prototype.pop = function() {
      return this.expressions.pop();
    };

    Block.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };

    Block.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };

    Block.prototype.isEmpty = function() {
      return !this.expressions.length;
    };

    Block.prototype.isStatement = function(o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };

    Block.prototype.jumps = function(o) {
      var exp, jumpNode, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (jumpNode = exp.jumps(o)) {
          return jumpNode;
        }
      }
    };

    Block.prototype.makeReturn = function(res) {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn(res);
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };

    Block.prototype.compileToFragments = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compileToFragments.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };

    Block.prototype.compileNode = function(o) {
      var answer, compiledNodes, fragments, index, node, top, _i, _len, _ref2;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      compiledNodes = [];
      _ref2 = this.expressions;
      for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
        node = _ref2[index];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          compiledNodes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          fragments = node.compileToFragments(o);
          if (!node.isStatement(o)) {
            fragments.unshift(this.makeCode("" + this.tab));
            fragments.push(this.makeCode(";"));
          }
          compiledNodes.push(fragments);
        } else {
          compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
        }
      }
      if (top) {
        if (this.spaced) {
          return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode("\n"));
        } else {
          return this.joinFragmentArrays(compiledNodes, '\n');
        }
      }
      if (compiledNodes.length) {
        answer = this.joinFragmentArrays(compiledNodes, ', ');
      } else {
        answer = [this.makeCode("void 0")];
      }
      if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Block.prototype.compileRoot = function(o) {
      var exp, fragments, i, name, prelude, preludeExps, rest, _i, _len, _ref2;
      o.indent = o.bare ? '' : TAB;
      o.level = LEVEL_TOP;
      this.spaced = true;
      o.scope = new Scope(null, this, null);
      _ref2 = o.locals || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        name = _ref2[_i];
        o.scope.parameter(name);
      }
      prelude = [];
      if (!o.bare) {
        preludeExps = (function() {
          var _j, _len1, _ref3, _results;
          _ref3 = this.expressions;
          _results = [];
          for (i = _j = 0, _len1 = _ref3.length; _j < _len1; i = ++_j) {
            exp = _ref3[i];
            if (!(exp.unwrap() instanceof Comment)) {
              break;
            }
            _results.push(exp);
          }
          return _results;
        }).call(this);
        rest = this.expressions.slice(preludeExps.length);
        this.expressions = preludeExps;
        if (preludeExps.length) {
          prelude = this.compileNode(merge(o, {
            indent: ''
          }));
          prelude.push(this.makeCode("\n"));
        }
        this.expressions = rest;
      }
      fragments = this.compileWithDeclarations(o);
      if (o.bare) {
        return fragments;
      }
      return [].concat(prelude, this.makeCode("(function() {\n"), fragments, this.makeCode("\n}).call(this);\n"));
    };

    Block.prototype.compileWithDeclarations = function(o) {
      var assigns, declars, exp, fragments, i, post, rest, scope, spaced, _i, _len, _ref2, _ref3, _ref4;
      fragments = [];
      post = [];
      _ref2 = this.expressions;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        exp = _ref2[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, 9e9);
        _ref3 = [this.spaced, false], spaced = _ref3[0], this.spaced = _ref3[1];
        _ref4 = [this.compileNode(o), spaced], fragments = _ref4[0], this.spaced = _ref4[1];
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if (declars || assigns) {
          if (i) {
            fragments.push(this.makeCode('\n'));
          }
          fragments.push(this.makeCode("" + this.tab + "var "));
          if (declars) {
            fragments.push(this.makeCode(scope.declaredVariables().join(', ')));
          }
          if (assigns) {
            if (declars) {
              fragments.push(this.makeCode(",\n" + (this.tab + TAB)));
            }
            fragments.push(this.makeCode(scope.assignedVariables().join(",\n" + (this.tab + TAB))));
          }
          fragments.push(this.makeCode(";\n" + (this.spaced ? '\n' : '')));
        } else if (fragments.length && post.length) {
          fragments.push(this.makeCode("\n"));
        }
      }
      return fragments.concat(post);
    };

    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };

    return Block;

  })(Base);

  exports.Literal = Literal = (function(_super) {
    __extends(Literal, _super);

    function Literal(value) {
      this.value = value;
    }

    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return Literal.__super__.makeReturn.apply(this, arguments);
      }
    };

    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };

    Literal.prototype.isStatement = function() {
      var _ref2;
      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
    };

    Literal.prototype.isComplex = NO;

    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };

    Literal.prototype.jumps = function(o) {
      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
        return this;
      }
      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
        return this;
      }
    };

    Literal.prototype.compileNode = function(o) {
      var answer, code, _ref2;
      code = this.value === 'this' ? ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0) ? o.scope.method.context : this.value : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      answer = this.isStatement() ? "" + this.tab + code + ";" : code;
      return [this.makeCode(answer)];
    };

    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };

    return Literal;

  })(Base);

  exports.Undefined = (function(_super) {
    __extends(Undefined, _super);

    function Undefined() {
      return Undefined.__super__.constructor.apply(this, arguments);
    }

    Undefined.prototype.isAssignable = NO;

    Undefined.prototype.isComplex = NO;

    Undefined.prototype.compileNode = function(o) {
      return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
    };

    return Undefined;

  })(Base);

  exports.Null = (function(_super) {
    __extends(Null, _super);

    function Null() {
      return Null.__super__.constructor.apply(this, arguments);
    }

    Null.prototype.isAssignable = NO;

    Null.prototype.isComplex = NO;

    Null.prototype.compileNode = function() {
      return [this.makeCode("null")];
    };

    return Null;

  })(Base);

  exports.Bool = (function(_super) {
    __extends(Bool, _super);

    Bool.prototype.isAssignable = NO;

    Bool.prototype.isComplex = NO;

    Bool.prototype.compileNode = function() {
      return [this.makeCode(this.val)];
    };

    function Bool(val) {
      this.val = val;
    }

    return Bool;

  })(Base);

  exports.Return = Return = (function(_super) {
    __extends(Return, _super);

    function Return(expression) {
      this.expression = expression;
    }

    Return.prototype.children = ['expression'];

    Return.prototype.isStatement = YES;

    Return.prototype.makeReturn = THIS;

    Return.prototype.jumps = THIS;

    Return.prototype.compileToFragments = function(o, level) {
      var expr, _ref2;
      expr = (_ref2 = this.expression) != null ? _ref2.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compileToFragments(o, level);
      } else {
        return Return.__super__.compileToFragments.call(this, o, level);
      }
    };

    Return.prototype.compileNode = function(o) {
      var answer;
      answer = [];
      answer.push(this.makeCode(this.tab + ("return" + (this.expression ? " " : ""))));
      if (this.expression) {
        answer = answer.concat(this.expression.compileToFragments(o, LEVEL_PAREN));
      }
      answer.push(this.makeCode(";"));
      return answer;
    };

    return Return;

  })(Base);

  exports.Value = Value = (function(_super) {
    __extends(Value, _super);

    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }

    Value.prototype.children = ['base', 'properties'];

    Value.prototype.add = function(props) {
      this.properties = this.properties.concat(props);
      return this;
    };

    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };

    Value.prototype.bareLiteral = function(type) {
      return !this.properties.length && this.base instanceof type;
    };

    Value.prototype.isArray = function() {
      return this.bareLiteral(Arr);
    };

    Value.prototype.isRange = function() {
      return this.bareLiteral(Range);
    };

    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };

    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };

    Value.prototype.isSimpleNumber = function() {
      return this.bareLiteral(Literal) && SIMPLENUM.test(this.base.value);
    };

    Value.prototype.isString = function() {
      return this.bareLiteral(Literal) && IS_STRING.test(this.base.value);
    };

    Value.prototype.isRegex = function() {
      return this.bareLiteral(Literal) && IS_REGEX.test(this.base.value);
    };

    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref2;
      _ref2 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };

    Value.prototype.isNotCallable = function() {
      return this.isSimpleNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject();
    };

    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };

    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };

    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };

    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };

    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };

    Value.prototype.looksStatic = function(className) {
      var _ref2;
      return this.base.value === className && this.properties.length && ((_ref2 = this.properties[0].name) != null ? _ref2.value : void 0) !== 'prototype';
    };

    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };

    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.add(name), new Value(bref || base.base, [nref || name])];
    };

    Value.prototype.compileNode = function(o) {
      var fragments, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      fragments = this.base.compileToFragments(o, (props.length ? LEVEL_ACCESS : null));
      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(fragmentsToText(fragments))) {
        fragments.push(this.makeCode('.'));
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        fragments.push.apply(fragments, prop.compileToFragments(o));
      }
      return fragments;
    };

    Value.prototype.unfoldSoak = function(o) {
      return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = (function(_this) {
        return function() {
          var fst, i, ifn, prop, ref, snd, _i, _len, _ref2, _ref3;
          if (ifn = _this.base.unfoldSoak(o)) {
            (_ref2 = ifn.body.properties).push.apply(_ref2, _this.properties);
            return ifn;
          }
          _ref3 = _this.properties;
          for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
            prop = _ref3[i];
            if (!prop.soak) {
              continue;
            }
            prop.soak = false;
            fst = new Value(_this.base, _this.properties.slice(0, i));
            snd = new Value(_this.base, _this.properties.slice(i));
            if (fst.isComplex()) {
              ref = new Literal(o.scope.freeVariable('ref'));
              fst = new Parens(new Assign(ref, fst));
              snd.base = ref;
            }
            return new If(new Existence(fst), snd, {
              soak: true
            });
          }
          return false;
        };
      })(this)();
    };

    return Value;

  })(Base);

  exports.Comment = Comment = (function(_super) {
    __extends(Comment, _super);

    function Comment(comment) {
      this.comment = comment;
    }

    Comment.prototype.isStatement = YES;

    Comment.prototype.makeReturn = THIS;

    Comment.prototype.compileNode = function(o, level) {
      var code, comment;
      comment = this.comment.replace(/^(\s*)#/gm, "$1 *");
      code = "/*" + (multident(comment, this.tab)) + (__indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return [this.makeCode("\n"), this.makeCode(code)];
    };

    return Comment;

  })(Base);

  exports.Call = Call = (function(_super) {
    __extends(Call, _super);

    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
      if (variable instanceof Value && variable.isNotCallable()) {
        variable.error("literal is not a function");
      }
    }

    Call.prototype.children = ['variable', 'args'];

    Call.prototype.newInstance = function() {
      var base, _ref2;
      base = ((_ref2 = this.variable) != null ? _ref2.base : void 0) || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };

    Call.prototype.superReference = function(o) {
      var accesses, method;
      method = o.scope.namedMethod();
      if (method != null ? method.klass : void 0) {
        accesses = [new Access(new Literal('__super__'))];
        if (method["static"]) {
          accesses.push(new Access(new Literal('constructor')));
        }
        accesses.push(new Access(new Literal(method.name)));
        return (new Value(new Literal(method.klass), accesses)).compile(o);
      } else if (method != null ? method.ctor : void 0) {
        return "" + method.name + ".__super__.constructor";
      } else {
        return this.error('cannot call super outside of an instance method.');
      }
    };

    Call.prototype.superThis = function(o) {
      var method;
      method = o.scope.method;
      return (method && !method.klass && method.context) || "this";
    };

    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, left, list, rite, _i, _len, _ref2, _ref3;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref2 = new Value(this.variable).cacheReference(o), left = _ref2[0], rite = _ref2[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref3 = list.reverse();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        call = _ref3[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };

    Call.prototype.compileNode = function(o) {
      var arg, argIndex, compiledArgs, compiledArray, fragments, preface, _i, _len, _ref2, _ref3;
      if ((_ref2 = this.variable) != null) {
        _ref2.front = this.front;
      }
      compiledArray = Splat.compileSplattedArray(o, this.args, true);
      if (compiledArray.length) {
        return this.compileSplat(o, compiledArray);
      }
      compiledArgs = [];
      _ref3 = this.args;
      for (argIndex = _i = 0, _len = _ref3.length; _i < _len; argIndex = ++_i) {
        arg = _ref3[argIndex];
        if (argIndex) {
          compiledArgs.push(this.makeCode(", "));
        }
        compiledArgs.push.apply(compiledArgs, arg.compileToFragments(o, LEVEL_LIST));
      }
      fragments = [];
      if (this.isSuper) {
        preface = this.superReference(o) + (".call(" + (this.superThis(o)));
        if (compiledArgs.length) {
          preface += ", ";
        }
        fragments.push(this.makeCode(preface));
      } else {
        if (this.isNew) {
          fragments.push(this.makeCode('new '));
        }
        fragments.push.apply(fragments, this.variable.compileToFragments(o, LEVEL_ACCESS));
        fragments.push(this.makeCode("("));
      }
      fragments.push.apply(fragments, compiledArgs);
      fragments.push(this.makeCode(")"));
      return fragments;
    };

    Call.prototype.compileSplat = function(o, splatArgs) {
      var answer, base, fun, idt, name, ref;
      if (this.isSuper) {
        return [].concat(this.makeCode("" + (this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", "), splatArgs, this.makeCode(")"));
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return [].concat(this.makeCode("(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})("), this.variable.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), splatArgs, this.makeCode(", function(){})"));
      }
      answer = [];
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        answer = answer.concat(this.makeCode("(" + ref + " = "), base.compileToFragments(o, LEVEL_LIST), this.makeCode(")"), name.compileToFragments(o));
      } else {
        fun = base.compileToFragments(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fragmentsToText(fun))) {
          fun = this.wrapInBraces(fun);
        }
        if (name) {
          ref = fragmentsToText(fun);
          fun.push.apply(fun, name.compileToFragments(o));
        } else {
          ref = 'null';
        }
        answer = answer.concat(fun);
      }
      return answer = answer.concat(this.makeCode(".apply(" + ref + ", "), splatArgs, this.makeCode(")"));
    };

    return Call;

  })(Base);

  exports.Extends = Extends = (function(_super) {
    __extends(Extends, _super);

    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }

    Extends.prototype.children = ['child', 'parent'];

    Extends.prototype.compileToFragments = function(o) {
      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compileToFragments(o);
    };

    return Extends;

  })(Base);

  exports.Access = Access = (function(_super) {
    __extends(Access, _super);

    function Access(name, tag) {
      this.name = name;
      this.name.asKey = true;
      this.soak = tag === 'soak';
    }

    Access.prototype.children = ['name'];

    Access.prototype.compileToFragments = function(o) {
      var name;
      name = this.name.compileToFragments(o);
      if (IDENTIFIER.test(fragmentsToText(name))) {
        name.unshift(this.makeCode("."));
      } else {
        name.unshift(this.makeCode("["));
        name.push(this.makeCode("]"));
      }
      return name;
    };

    Access.prototype.isComplex = NO;

    return Access;

  })(Base);

  exports.Index = Index = (function(_super) {
    __extends(Index, _super);

    function Index(index) {
      this.index = index;
    }

    Index.prototype.children = ['index'];

    Index.prototype.compileToFragments = function(o) {
      return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
    };

    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };

    return Index;

  })(Base);

  exports.Range = Range = (function(_super) {
    __extends(Range, _super);

    Range.prototype.children = ['from', 'to'];

    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }

    Range.prototype.compileVariables = function(o) {
      var step, _ref2, _ref3, _ref4, _ref5;
      o = merge(o, {
        top: true
      });
      _ref2 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST)), this.fromC = _ref2[0], this.fromVar = _ref2[1];
      _ref3 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST)), this.toC = _ref3[0], this.toVar = _ref3[1];
      if (step = del(o, 'step')) {
        _ref4 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST)), this.step = _ref4[0], this.stepVar = _ref4[1];
      }
      _ref5 = [this.fromVar.match(NUMBER), this.toVar.match(NUMBER)], this.fromNum = _ref5[0], this.toNum = _ref5[1];
      if (this.stepVar) {
        return this.stepNum = this.stepVar.match(NUMBER);
      }
    };

    Range.prototype.compileNode = function(o) {
      var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, stepPart, to, varPart, _ref2, _ref3;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      known = this.fromNum && this.toNum;
      idx = del(o, 'index');
      idxName = del(o, 'name');
      namedIndex = idxName && idxName !== idx;
      varPart = "" + idx + " = " + this.fromC;
      if (this.toC !== this.toVar) {
        varPart += ", " + this.toC;
      }
      if (this.step !== this.stepVar) {
        varPart += ", " + this.step;
      }
      _ref2 = ["" + idx + " <" + this.equals, "" + idx + " >" + this.equals], lt = _ref2[0], gt = _ref2[1];
      condPart = this.stepNum ? parseNum(this.stepNum[0]) > 0 ? "" + lt + " " + this.toVar : "" + gt + " " + this.toVar : known ? ((_ref3 = [parseNum(this.fromNum[0]), parseNum(this.toNum[0])], from = _ref3[0], to = _ref3[1], _ref3), from <= to ? "" + lt + " " + to : "" + gt + " " + to) : (cond = this.stepVar ? "" + this.stepVar + " > 0" : "" + this.fromVar + " <= " + this.toVar, "" + cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
      stepPart = this.stepVar ? "" + idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? "" + idx + "++" : "" + idx + "--" : namedIndex ? "" + cond + " ? ++" + idx + " : --" + idx : "" + cond + " ? " + idx + "++ : " + idx + "--";
      if (namedIndex) {
        varPart = "" + idxName + " = " + varPart;
      }
      if (namedIndex) {
        stepPart = "" + idxName + " = " + stepPart;
      }
      return [this.makeCode("" + varPart + "; " + condPart + "; " + stepPart)];
    };

    Range.prototype.compileArray = function(o) {
      var args, body, cond, hasArgs, i, idt, post, pre, range, result, vars, _i, _ref2, _ref3, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          _results = [];
          for (var _i = _ref2 = +this.fromNum, _ref3 = +this.toNum; _ref2 <= _ref3 ? _i <= _ref3 : _i >= _ref3; _ref2 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return [this.makeCode("[" + (range.join(', ')) + "]")];
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = fragmentsToText(this.compileNode(o));
      } else {
        vars = ("" + i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
        cond = "" + this.fromVar + " <= " + this.toVar;
        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      hasArgs = function(node) {
        return node != null ? node.contains(isLiteralArguments) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return [this.makeCode("(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")")];
    };

    return Range;

  })(Base);

  exports.Slice = Slice = (function(_super) {
    __extends(Slice, _super);

    Slice.prototype.children = ['range'];

    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }

    Slice.prototype.compileNode = function(o) {
      var compiled, compiledText, from, fromCompiled, to, toStr, _ref2;
      _ref2 = this.range, to = _ref2.to, from = _ref2.from;
      fromCompiled = from && from.compileToFragments(o, LEVEL_PAREN) || [this.makeCode('0')];
      if (to) {
        compiled = to.compileToFragments(o, LEVEL_PAREN);
        compiledText = fragmentsToText(compiled);
        if (!(!this.range.exclusive && +compiledText === -1)) {
          toStr = ', ' + (this.range.exclusive ? compiledText : SIMPLENUM.test(compiledText) ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + (fragmentsToText(compiled)) + " + 1 || 9e9"));
        }
      }
      return [this.makeCode(".slice(" + (fragmentsToText(fromCompiled)) + (toStr || '') + ")")];
    };

    return Slice;

  })(Base);

  exports.Obj = Obj = (function(_super) {
    __extends(Obj, _super);

    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }

    Obj.prototype.children = ['properties'];

    Obj.prototype.compileNode = function(o) {
      var answer, i, idt, indent, join, lastNoncom, node, prop, props, _i, _j, _len, _len1;
      props = this.properties;
      if (!props.length) {
        return [this.makeCode(this.front ? '({})' : '{}')];
      }
      if (this.generated) {
        for (_i = 0, _len = props.length; _i < _len; _i++) {
          node = props[_i];
          if (node instanceof Value) {
            node.error('cannot have an implicit value in an implicit object');
          }
        }
      }
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      answer = [];
      for (i = _j = 0, _len1 = props.length; _j < _len1; i = ++_j) {
        prop = props[i];
        join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
        indent = prop instanceof Comment ? '' : idt;
        if (prop instanceof Assign && prop.variable instanceof Value && prop.variable.hasProperties()) {
          prop.variable.error('Invalid object key');
        }
        if (prop instanceof Value && prop["this"]) {
          prop = new Assign(prop.properties[0].name, prop, 'object');
        }
        if (!(prop instanceof Comment)) {
          if (!(prop instanceof Assign)) {
            prop = new Assign(prop, prop, 'object');
          }
          (prop.variable.base || prop.variable).asKey = true;
        }
        if (indent) {
          answer.push(this.makeCode(indent));
        }
        answer.push.apply(answer, prop.compileToFragments(o, LEVEL_TOP));
        if (join) {
          answer.push(this.makeCode(join));
        }
      }
      answer.unshift(this.makeCode("{" + (props.length && '\n')));
      answer.push(this.makeCode("" + (props.length && '\n' + this.tab) + "}"));
      if (this.front) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Obj.prototype.assigns = function(name) {
      var prop, _i, _len, _ref2;
      _ref2 = this.properties;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        prop = _ref2[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Obj;

  })(Base);

  exports.Arr = Arr = (function(_super) {
    __extends(Arr, _super);

    function Arr(objs) {
      this.objects = objs || [];
    }

    Arr.prototype.children = ['objects'];

    Arr.prototype.compileNode = function(o) {
      var answer, compiledObjs, fragments, index, obj, _i, _len;
      if (!this.objects.length) {
        return [this.makeCode('[]')];
      }
      o.indent += TAB;
      answer = Splat.compileSplattedArray(o, this.objects);
      if (answer.length) {
        return answer;
      }
      answer = [];
      compiledObjs = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.objects;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          _results.push(obj.compileToFragments(o, LEVEL_LIST));
        }
        return _results;
      }).call(this);
      for (index = _i = 0, _len = compiledObjs.length; _i < _len; index = ++_i) {
        fragments = compiledObjs[index];
        if (index) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, fragments);
      }
      if (fragmentsToText(answer).indexOf('\n') >= 0) {
        answer.unshift(this.makeCode("[\n" + o.indent));
        answer.push(this.makeCode("\n" + this.tab + "]"));
      } else {
        answer.unshift(this.makeCode("["));
        answer.push(this.makeCode("]"));
      }
      return answer;
    };

    Arr.prototype.assigns = function(name) {
      var obj, _i, _len, _ref2;
      _ref2 = this.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Arr;

  })(Base);

  exports.Class = Class = (function(_super) {
    __extends(Class, _super);

    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Block;
      this.boundFuncs = [];
      this.body.classBody = true;
    }

    Class.prototype.children = ['variable', 'parent', 'body'];

    Class.prototype.determineName = function() {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      if (__indexOf.call(STRICT_PROSCRIBED, decl) >= 0) {
        this.variable.error("class variable name may not be " + decl);
      }
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };

    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };

    Class.prototype.addBoundFunctions = function(o) {
      var bvar, lhs, _i, _len, _ref2;
      _ref2 = this.boundFuncs;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        bvar = _ref2[_i];
        lhs = (new Value(new Literal("this"), [new Access(bvar)])).compile(o);
        this.ctor.body.unshift(new Literal("" + lhs + " = " + (utility('bind')) + "(" + lhs + ", this)"));
      }
    };

    Class.prototype.addProperties = function(node, name, o) {
      var assign, base, exprs, func, props;
      props = node.base.properties.slice(0);
      exprs = (function() {
        var _results;
        _results = [];
        while (assign = props.shift()) {
          if (assign instanceof Assign) {
            base = assign.variable.base;
            delete assign.context;
            func = assign.value;
            if (base.value === 'constructor') {
              if (this.ctor) {
                assign.error('cannot define more than one constructor in a class');
              }
              if (func.bound) {
                assign.error('cannot define a constructor as a bound function');
              }
              if (func instanceof Code) {
                assign = this.ctor = func;
              } else {
                this.externalCtor = o.classScope.freeVariable('class');
                assign = new Assign(new Literal(this.externalCtor), func);
              }
            } else {
              if (assign.variable["this"]) {
                func["static"] = true;
              } else {
                assign.variable = new Value(new Literal(name), [new Access(new Literal('prototype')), new Access(base)]);
                if (func instanceof Code && func.bound) {
                  this.boundFuncs.push(base);
                  func.bound = false;
                }
              }
            }
          }
          _results.push(assign);
        }
        return _results;
      }).call(this);
      return compact(exprs);
    };

    Class.prototype.walkBody = function(name, o) {
      return this.traverseChildren(false, (function(_this) {
        return function(child) {
          var cont, exps, i, node, _i, _len, _ref2;
          cont = true;
          if (child instanceof Class) {
            return false;
          }
          if (child instanceof Block) {
            _ref2 = exps = child.expressions;
            for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
              node = _ref2[i];
              if (node instanceof Assign && node.variable.looksStatic(name)) {
                node.value["static"] = true;
              } else if (node instanceof Value && node.isObject(true)) {
                cont = false;
                exps[i] = _this.addProperties(node, name, o);
              }
            }
            child.expressions = exps = flatten(exps);
          }
          return cont && !(child instanceof Class);
        };
      })(this));
    };

    Class.prototype.hoistDirectivePrologue = function() {
      var expressions, index, node;
      index = 0;
      expressions = this.body.expressions;
      while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
        ++index;
      }
      return this.directives = expressions.splice(0, index);
    };

    Class.prototype.ensureConstructor = function(name) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (this.externalCtor) {
          this.ctor.body.push(new Literal("" + this.externalCtor + ".apply(this, arguments)"));
        } else if (this.parent) {
          this.ctor.body.push(new Literal("" + name + ".__super__.constructor.apply(this, arguments)"));
        }
        this.ctor.body.makeReturn();
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };

    Class.prototype.compileNode = function(o) {
      var args, argumentsNode, func, jumpNode, klass, lname, name, superClass, _ref2;
      if (jumpNode = this.body.jumps()) {
        jumpNode.error('Class bodies cannot contain pure statements');
      }
      if (argumentsNode = this.body.contains(isLiteralArguments)) {
        argumentsNode.error("Class bodies shouldn't reference arguments");
      }
      name = this.determineName() || '_Class';
      if (name.reserved) {
        name = "_" + name;
      }
      lname = new Literal(name);
      func = new Code([], Block.wrap([this.body]));
      args = [];
      o.classScope = func.makeScope(o.scope);
      this.hoistDirectivePrologue();
      this.setContext(name);
      this.walkBody(name, o);
      this.ensureConstructor(name);
      this.addBoundFunctions(o);
      this.body.spaced = true;
      this.body.expressions.push(lname);
      if (this.parent) {
        superClass = new Literal(o.classScope.freeVariable('super', false));
        this.body.expressions.unshift(new Extends(lname, superClass));
        func.params.push(new Param(superClass));
        args.push(this.parent);
      }
      (_ref2 = this.body.expressions).unshift.apply(_ref2, this.directives);
      klass = new Parens(new Call(func, args));
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compileToFragments(o);
    };

    return Class;

  })(Base);

  exports.Assign = Assign = (function(_super) {
    __extends(Assign, _super);

    function Assign(variable, value, context, options) {
      var forbidden, name, _ref2;
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
      this.subpattern = options && options.subpattern;
      forbidden = (_ref2 = (name = this.variable.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0);
      if (forbidden && this.context !== 'object') {
        this.variable.error("variable name may not be \"" + name + "\"");
      }
    }

    Assign.prototype.children = ['variable', 'value'];

    Assign.prototype.isStatement = function(o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && __indexOf.call(this.context, "?") >= 0;
    };

    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };

    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };

    Assign.prototype.compileNode = function(o) {
      var answer, compiledName, isValue, match, name, val, varBase, _ref2, _ref3, _ref4, _ref5;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref2 = this.context) === '||=' || _ref2 === '&&=' || _ref2 === '?=') {
          return this.compileConditional(o);
        }
        if ((_ref3 = this.context) === '**=' || _ref3 === '//=' || _ref3 === '%%=') {
          return this.compileSpecialMath(o);
        }
      }
      compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
      name = fragmentsToText(compiledName);
      if (!this.context) {
        varBase = this.variable.unwrapAll();
        if (!varBase.isAssignable()) {
          this.variable.error("\"" + (this.variable.compile(o)) + "\" cannot be assigned");
        }
        if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
          if (this.param) {
            o.scope.add(name, 'var');
          } else {
            o.scope.find(name);
          }
        }
      }
      if (this.value instanceof Code && (match = METHOD_DEF.exec(name))) {
        if (match[2]) {
          this.value.klass = match[1];
        }
        this.value.name = (_ref4 = (_ref5 = match[3]) != null ? _ref5 : match[4]) != null ? _ref4 : match[5];
      }
      val = this.value.compileToFragments(o, LEVEL_LIST);
      if (this.context === 'object') {
        return compiledName.concat(this.makeCode(": "), val);
      }
      answer = compiledName.concat(this.makeCode(" " + (this.context || '=') + " "), val);
      if (o.level <= LEVEL_LIST) {
        return answer;
      } else {
        return this.wrapInBraces(answer);
      }
    };

    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, expandedIdx, fragments, i, idx, isObject, ivar, name, obj, objects, olen, ref, rest, top, val, value, vvar, vvarText, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        code = value.compileToFragments(o);
        if (o.level >= LEVEL_OP) {
          return this.wrapInBraces(code);
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref2 = obj, (_ref3 = _ref2.variable, idx = _ref3.base), obj = _ref2.value;
        } else {
          idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        if (_ref4 = obj.unwrap().value, __indexOf.call(RESERVED, _ref4) >= 0) {
          obj.error("assignment to a reserved word: " + (obj.compile(o)));
        }
        return new Assign(obj, value, null, {
          param: this.param
        }).compileToFragments(o, LEVEL_TOP);
      }
      vvar = value.compileToFragments(o, LEVEL_LIST);
      vvarText = fragmentsToText(vvar);
      assigns = [];
      expandedIdx = false;
      if (!IDENTIFIER.test(vvarText) || this.variable.assigns(vvarText)) {
        assigns.push([this.makeCode("" + (ref = o.scope.freeVariable('ref')) + " = ")].concat(__slice.call(vvar)));
        vvar = [this.makeCode(ref)];
        vvarText = ref;
      }
      for (i = _i = 0, _len = objects.length; _i < _len; i = ++_i) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref5 = obj, (_ref6 = _ref5.variable, idx = _ref6.base), obj = _ref5.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref7 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref7[0], idx = _ref7[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!expandedIdx && obj instanceof Splat) {
          name = obj.name.unwrap().value;
          obj = obj.unwrap();
          val = "" + olen + " <= " + vvarText + ".length ? " + (utility('slice')) + ".call(" + vvarText + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvarText + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          expandedIdx = "" + ivar + "++";
        } else if (!expandedIdx && obj instanceof Expansion) {
          if (rest = olen - i - 1) {
            if (rest === 1) {
              expandedIdx = "" + vvarText + ".length - 1";
            } else {
              ivar = o.scope.freeVariable('i');
              val = new Literal("" + ivar + " = " + vvarText + ".length - " + rest);
              expandedIdx = "" + ivar + "++";
              assigns.push(val.compileToFragments(o, LEVEL_LIST));
            }
          }
          continue;
        } else {
          name = obj.unwrap().value;
          if (obj instanceof Splat || obj instanceof Expansion) {
            obj.error("multiple splats/expansions are disallowed in an assignment");
          }
          if (typeof idx === 'number') {
            idx = new Literal(expandedIdx || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvarText), [new (acc ? Access : Index)(idx)]);
        }
        if ((name != null) && __indexOf.call(RESERVED, name) >= 0) {
          obj.error("assignment to a reserved word: " + (obj.compile(o)));
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param,
          subpattern: true
        }).compileToFragments(o, LEVEL_LIST));
      }
      if (!(top || this.subpattern)) {
        assigns.push(vvar);
      }
      fragments = this.joinFragmentArrays(assigns, ', ');
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    Assign.prototype.compileConditional = function(o) {
      var fragments, left, right, _ref2;
      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
      if (!left.properties.length && left.base instanceof Literal && left.base.value !== "this" && !o.scope.check(left.base.value)) {
        this.variable.error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been declared before");
      }
      if (__indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
        return new If(new Existence(left), right, {
          type: 'if'
        }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
      } else {
        fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
        if (o.level <= LEVEL_LIST) {
          return fragments;
        } else {
          return this.wrapInBraces(fragments);
        }
      }
    };

    Assign.prototype.compileSpecialMath = function(o) {
      var left, right, _ref2;
      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
      return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
    };

    Assign.prototype.compileSplice = function(o) {
      var answer, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref2, _ref3, _ref4;
      _ref2 = this.variable.properties.pop().range, from = _ref2.from, to = _ref2.to, exclusive = _ref2.exclusive;
      name = this.variable.compile(o);
      if (from) {
        _ref3 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = _ref3[0], fromRef = _ref3[1];
      } else {
        fromDecl = fromRef = '0';
      }
      if (to) {
        if (from instanceof Value && from.isSimpleNumber() && to instanceof Value && to.isSimpleNumber()) {
          to = to.compile(o) - fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      _ref4 = this.value.cache(o, LEVEL_LIST), valDef = _ref4[0], valRef = _ref4[1];
      answer = [].concat(this.makeCode("[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat("), valDef, this.makeCode(")), "), valRef);
      if (o.level > LEVEL_TOP) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    return Assign;

  })(Base);

  exports.Code = Code = (function(_super) {
    __extends(Code, _super);

    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block;
      this.bound = tag === 'boundfunc';
    }

    Code.prototype.children = ['params', 'body'];

    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };

    Code.prototype.jumps = NO;

    Code.prototype.makeScope = function(parentScope) {
      return new Scope(parentScope, this.body, this);
    };

    Code.prototype.compileNode = function(o) {
      var answer, boundfunc, code, exprs, i, lit, p, param, params, ref, splats, uniqs, val, wasEmpty, wrapper, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (this.bound && ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0)) {
        this.context = o.scope.method.context;
      }
      if (this.bound && !this.context) {
        this.context = '_this';
        wrapper = new Code([new Param(new Literal(this.context))], new Block([this]));
        boundfunc = new Call(wrapper, [new Literal('this')]);
        boundfunc.updateLocationDataIfMissing(this.locationData);
        return boundfunc.compileNode(o);
      }
      o.scope = del(o, 'classScope') || this.makeScope(o.scope);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      delete o.isExistentialEquals;
      params = [];
      exprs = [];
      _ref3 = this.params;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        param = _ref3[_i];
        if (!(param instanceof Expansion)) {
          o.scope.parameter(param.asReference(o));
        }
      }
      _ref4 = this.params;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        param = _ref4[_j];
        if (!(param.splat || param instanceof Expansion)) {
          continue;
        }
        _ref5 = this.params;
        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
          p = _ref5[_k].name;
          if (!(!(param instanceof Expansion))) {
            continue;
          }
          if (p["this"]) {
            p = p.properties[0].name;
          }
          if (p.value) {
            o.scope.add(p.value, 'var', true);
          }
        }
        splats = new Assign(new Value(new Arr((function() {
          var _l, _len3, _ref6, _results;
          _ref6 = this.params;
          _results = [];
          for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
            p = _ref6[_l];
            _results.push(p.asReference(o));
          }
          return _results;
        }).call(this))), new Value(new Literal('arguments')));
        break;
      }
      _ref6 = this.params;
      for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
        param = _ref6[_l];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          params.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_ref7 = this.body.expressions).unshift.apply(_ref7, exprs);
      }
      for (i = _m = 0, _len4 = params.length; _m < _len4; i = ++_m) {
        p = params[i];
        params[i] = p.compileToFragments(o);
        o.scope.parameter(fragmentsToText(params[i]));
      }
      uniqs = [];
      this.eachParamName(function(name, node) {
        if (__indexOf.call(uniqs, name) >= 0) {
          node.error("multiple parameters named '" + name + "'");
        }
        return uniqs.push(name);
      });
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      code = 'function';
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(';
      answer = [this.makeCode(code)];
      for (i = _n = 0, _len5 = params.length; _n < _len5; i = ++_n) {
        p = params[i];
        if (i) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, p);
      }
      answer.push(this.makeCode(') {'));
      if (!this.body.isEmpty()) {
        answer = answer.concat(this.makeCode("\n"), this.body.compileWithDeclarations(o), this.makeCode("\n" + this.tab));
      }
      answer.push(this.makeCode('}'));
      if (this.ctor) {
        return [this.makeCode(this.tab)].concat(__slice.call(answer));
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Code.prototype.eachParamName = function(iterator) {
      var param, _i, _len, _ref2, _results;
      _ref2 = this.params;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        _results.push(param.eachName(iterator));
      }
      return _results;
    };

    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };

    return Code;

  })(Base);

  exports.Param = Param = (function(_super) {
    __extends(Param, _super);

    function Param(name, value, splat) {
      var _ref2;
      this.name = name;
      this.value = value;
      this.splat = splat;
      if (_ref2 = (name = this.name.unwrapAll().value), __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0) {
        this.name.error("parameter name \"" + name + "\" is not allowed");
      }
    }

    Param.prototype.children = ['name', 'value'];

    Param.prototype.compileToFragments = function(o) {
      return this.name.compileToFragments(o, LEVEL_LIST);
    };

    Param.prototype.asReference = function(o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal(o.scope.freeVariable(node.value));
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      node.updateLocationDataIfMissing(this.locationData);
      return this.reference = node;
    };

    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };

    Param.prototype.eachName = function(iterator, name) {
      var atParam, node, obj, _i, _len, _ref2;
      if (name == null) {
        name = this.name;
      }
      atParam = function(obj) {
        var node;
        node = obj.properties[0].name;
        if (!node.value.reserved) {
          return iterator(node.value, node);
        }
      };
      if (name instanceof Literal) {
        return iterator(name.value, name);
      }
      if (name instanceof Value) {
        return atParam(name);
      }
      _ref2 = name.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj instanceof Assign) {
          this.eachName(iterator, obj.value.unwrap());
        } else if (obj instanceof Splat) {
          node = obj.name.unwrap();
          iterator(node.value, node);
        } else if (obj instanceof Value) {
          if (obj.isArray() || obj.isObject()) {
            this.eachName(iterator, obj.base);
          } else if (obj["this"]) {
            atParam(obj);
          } else {
            iterator(obj.base.value, obj.base);
          }
        } else if (!(obj instanceof Expansion)) {
          obj.error("illegal parameter " + (obj.compile()));
        }
      }
    };

    return Param;

  })(Base);

  exports.Splat = Splat = (function(_super) {
    __extends(Splat, _super);

    Splat.prototype.children = ['name'];

    Splat.prototype.isAssignable = YES;

    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }

    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };

    Splat.prototype.compileToFragments = function(o) {
      return this.name.compileToFragments(o);
    };

    Splat.prototype.unwrap = function() {
      return this.name;
    };

    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, compiledNode, concatPart, fragments, i, index, node, _i, _len;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return [];
      }
      if (list.length === 1) {
        node = list[0];
        fragments = node.compileToFragments(o, LEVEL_LIST);
        if (apply) {
          return fragments;
        }
        return [].concat(node.makeCode("" + (utility('slice')) + ".call("), fragments, node.makeCode(")"));
      }
      args = list.slice(index);
      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
        node = args[i];
        compiledNode = node.compileToFragments(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? [].concat(node.makeCode("" + (utility('slice')) + ".call("), compiledNode, node.makeCode(")")) : [].concat(node.makeCode("["), compiledNode, node.makeCode("]"));
      }
      if (index === 0) {
        node = list[0];
        concatPart = node.joinFragmentArrays(args.slice(1), ', ');
        return args[0].concat(node.makeCode(".concat("), concatPart, node.makeCode(")"));
      }
      base = (function() {
        var _j, _len1, _ref2, _results;
        _ref2 = list.slice(0, index);
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          node = _ref2[_j];
          _results.push(node.compileToFragments(o, LEVEL_LIST));
        }
        return _results;
      })();
      base = list[0].joinFragmentArrays(base, ', ');
      concatPart = list[index].joinFragmentArrays(args, ', ');
      return [].concat(list[0].makeCode("["), base, list[index].makeCode("].concat("), concatPart, (last(list)).makeCode(")"));
    };

    return Splat;

  })(Base);

  exports.Expansion = Expansion = (function(_super) {
    __extends(Expansion, _super);

    function Expansion() {
      return Expansion.__super__.constructor.apply(this, arguments);
    }

    Expansion.prototype.isComplex = NO;

    Expansion.prototype.compileNode = function(o) {
      return this.error('Expansion must be used inside a destructuring assignment or parameter list');
    };

    Expansion.prototype.asReference = function(o) {
      return this;
    };

    Expansion.prototype.eachName = function(iterator) {};

    return Expansion;

  })(Base);

  exports.While = While = (function(_super) {
    __extends(While, _super);

    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }

    While.prototype.children = ['condition', 'guard', 'body'];

    While.prototype.isStatement = YES;

    While.prototype.makeReturn = function(res) {
      if (res) {
        return While.__super__.makeReturn.apply(this, arguments);
      } else {
        this.returns = !this.jumps({
          loop: true
        });
        return this;
      }
    };

    While.prototype.addBody = function(body) {
      this.body = body;
      return this;
    };

    While.prototype.jumps = function() {
      var expressions, jumpNode, node, _i, _len;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
        node = expressions[_i];
        if (jumpNode = node.jumps({
          loop: true
        })) {
          return jumpNode;
        }
      }
      return false;
    };

    While.prototype.compileNode = function(o) {
      var answer, body, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = this.makeCode('');
      } else {
        if (this.returns) {
          body.makeReturn(rvar = o.scope.freeVariable('results'));
          set = "" + this.tab + rvar + " = [];\n";
        }
        if (this.guard) {
          if (body.expressions.length > 1) {
            body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
          } else {
            if (this.guard) {
              body = Block.wrap([new If(this.guard, body)]);
            }
          }
        }
        body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab));
      }
      answer = [].concat(this.makeCode(set + this.tab + "while ("), this.condition.compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
      if (this.returns) {
        answer.push(this.makeCode("\n" + this.tab + "return " + rvar + ";"));
      }
      return answer;
    };

    return While;

  })(Base);

  exports.Op = Op = (function(_super) {
    var CONVERSIONS, INVERSIONS;

    __extends(Op, _super);

    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        return this.generateDo(first);
      }
      if (op === 'new') {
        if (first instanceof Call && !first["do"] && !first.isNew) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound || first["do"]) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }

    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };

    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };

    Op.prototype.children = ['first', 'second'];

    Op.prototype.isSimpleNumber = NO;

    Op.prototype.isUnary = function() {
      return !this.second;
    };

    Op.prototype.isComplex = function() {
      var _ref2;
      return !(this.isUnary() && ((_ref2 = this.operator) === '+' || _ref2 === '-')) || this.first.isComplex();
    };

    Op.prototype.isChainable = function() {
      var _ref2;
      return (_ref2 = this.operator) === '<' || _ref2 === '>' || _ref2 === '>=' || _ref2 === '<=' || _ref2 === '===' || _ref2 === '!==';
    };

    Op.prototype.invert = function() {
      var allInvertable, curr, fst, op, _ref2;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref2 = fst.operator) === '!' || _ref2 === 'in' || _ref2 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };

    Op.prototype.unfoldSoak = function(o) {
      var _ref2;
      return ((_ref2 = this.operator) === '++' || _ref2 === '--' || _ref2 === 'delete') && unfoldSoak(o, this, 'first');
    };

    Op.prototype.generateDo = function(exp) {
      var call, func, param, passedParams, ref, _i, _len, _ref2;
      passedParams = [];
      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
      _ref2 = func.params || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        if (param.value) {
          passedParams.push(param.value);
          delete param.value;
        } else {
          passedParams.push(param);
        }
      }
      call = new Call(exp, passedParams);
      call["do"] = true;
      return call;
    };

    Op.prototype.compileNode = function(o) {
      var answer, isChain, lhs, rhs, _ref2, _ref3;
      isChain = this.isChainable() && this.first.isChainable();
      if (!isChain) {
        this.first.front = this.front;
      }
      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
        this.error('delete operand may not be argument or var');
      }
      if (((_ref2 = this.operator) === '--' || _ref2 === '++') && (_ref3 = this.first.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref3) >= 0)) {
        this.error("cannot increment/decrement \"" + (this.first.unwrapAll().value) + "\"");
      }
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (isChain) {
        return this.compileChain(o);
      }
      switch (this.operator) {
        case '?':
          return this.compileExistence(o);
        case '**':
          return this.compilePower(o);
        case '//':
          return this.compileFloorDivision(o);
        case '%%':
          return this.compileModulo(o);
        default:
          lhs = this.first.compileToFragments(o, LEVEL_OP);
          rhs = this.second.compileToFragments(o, LEVEL_OP);
          answer = [].concat(lhs, this.makeCode(" " + this.operator + " "), rhs);
          if (o.level <= LEVEL_OP) {
            return answer;
          } else {
            return this.wrapInBraces(answer);
          }
      }
    };

    Op.prototype.compileChain = function(o) {
      var fragments, fst, shared, _ref2;
      _ref2 = this.first.second.cache(o), this.first.second = _ref2[0], shared = _ref2[1];
      fst = this.first.compileToFragments(o, LEVEL_OP);
      fragments = fst.concat(this.makeCode(" " + (this.invert ? '&&' : '||') + " "), shared.compileToFragments(o), this.makeCode(" " + this.operator + " "), this.second.compileToFragments(o, LEVEL_OP));
      return this.wrapInBraces(fragments);
    };

    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = new Literal(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst), ref, {
        type: 'if'
      }).addElse(this.second).compileToFragments(o);
    };

    Op.prototype.compileUnary = function(o) {
      var op, parts, plusMinus;
      parts = [];
      op = this.operator;
      parts.push([this.makeCode(op)]);
      if (op === '!' && this.first instanceof Existence) {
        this.first.negated = !this.first.negated;
        return this.first.compileToFragments(o);
      }
      if (o.level >= LEVEL_ACCESS) {
        return (new Parens(this)).compileToFragments(o);
      }
      plusMinus = op === '+' || op === '-';
      if ((op === 'new' || op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
        parts.push([this.makeCode(' ')]);
      }
      if ((plusMinus && this.first instanceof Op) || (op === 'new' && this.first.isStatement(o))) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compileToFragments(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.compilePower = function(o) {
      var pow;
      pow = new Value(new Literal('Math'), [new Access(new Literal('pow'))]);
      return new Call(pow, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.compileFloorDivision = function(o) {
      var div, floor;
      floor = new Value(new Literal('Math'), [new Access(new Literal('floor'))]);
      div = new Op('/', this.first, this.second);
      return new Call(floor, [div]).compileToFragments(o);
    };

    Op.prototype.compileModulo = function(o) {
      var mod;
      mod = new Value(new Literal(utility('modulo')));
      return new Call(mod, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };

    return Op;

  })(Base);

  exports.In = In = (function(_super) {
    __extends(In, _super);

    function In(object, array) {
      this.object = object;
      this.array = array;
    }

    In.prototype.children = ['object', 'array'];

    In.prototype.invert = NEGATE;

    In.prototype.compileNode = function(o) {
      var hasSplat, obj, _i, _len, _ref2;
      if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
        _ref2 = this.array.base.objects;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          if (!(obj instanceof Splat)) {
            continue;
          }
          hasSplat = true;
          break;
        }
        if (!hasSplat) {
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    };

    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, ref, sub, tests, _i, _len, _ref2, _ref3, _ref4;
      _ref2 = this.object.cache(o, LEVEL_OP), sub = _ref2[0], ref = _ref2[1];
      _ref3 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref3[0], cnj = _ref3[1];
      tests = [];
      _ref4 = this.array.base.objects;
      for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
        item = _ref4[i];
        if (i) {
          tests.push(this.makeCode(cnj));
        }
        tests = tests.concat((i ? ref : sub), this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
      }
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return this.wrapInBraces(tests);
      }
    };

    In.prototype.compileLoopTest = function(o) {
      var fragments, ref, sub, _ref2;
      _ref2 = this.object.cache(o, LEVEL_LIST), sub = _ref2[0], ref = _ref2[1];
      fragments = [].concat(this.makeCode(utility('indexOf') + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
      if (fragmentsToText(sub) === fragmentsToText(ref)) {
        return fragments;
      }
      fragments = sub.concat(this.makeCode(', '), fragments);
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };

    return In;

  })(Base);

  exports.Try = Try = (function(_super) {
    __extends(Try, _super);

    function Try(attempt, errorVariable, recovery, ensure) {
      this.attempt = attempt;
      this.errorVariable = errorVariable;
      this.recovery = recovery;
      this.ensure = ensure;
    }

    Try.prototype.children = ['attempt', 'recovery', 'ensure'];

    Try.prototype.isStatement = YES;

    Try.prototype.jumps = function(o) {
      var _ref2;
      return this.attempt.jumps(o) || ((_ref2 = this.recovery) != null ? _ref2.jumps(o) : void 0);
    };

    Try.prototype.makeReturn = function(res) {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn(res);
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn(res);
      }
      return this;
    };

    Try.prototype.compileNode = function(o) {
      var catchPart, ensurePart, placeholder, tryPart;
      o.indent += TAB;
      tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
      catchPart = this.recovery ? (placeholder = new Literal('_error'), this.errorVariable ? this.recovery.unshift(new Assign(this.errorVariable, placeholder)) : void 0, [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}"))) : !(this.ensure || this.recovery) ? [this.makeCode(' catch (_error) {}')] : [];
      ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}")) : [];
      return [].concat(this.makeCode("" + this.tab + "try {\n"), tryPart, this.makeCode("\n" + this.tab + "}"), catchPart, ensurePart);
    };

    return Try;

  })(Base);

  exports.Throw = Throw = (function(_super) {
    __extends(Throw, _super);

    function Throw(expression) {
      this.expression = expression;
    }

    Throw.prototype.children = ['expression'];

    Throw.prototype.isStatement = YES;

    Throw.prototype.jumps = NO;

    Throw.prototype.makeReturn = THIS;

    Throw.prototype.compileNode = function(o) {
      return [].concat(this.makeCode(this.tab + "throw "), this.expression.compileToFragments(o), this.makeCode(";"));
    };

    return Throw;

  })(Base);

  exports.Existence = Existence = (function(_super) {
    __extends(Existence, _super);

    function Existence(expression) {
      this.expression = expression;
    }

    Existence.prototype.children = ['expression'];

    Existence.prototype.invert = NEGATE;

    Existence.prototype.compileNode = function(o) {
      var cmp, cnj, code, _ref2;
      this.expression.front = this.front;
      code = this.expression.compile(o, LEVEL_OP);
      if (IDENTIFIER.test(code) && !o.scope.check(code)) {
        _ref2 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = _ref2[0], cnj = _ref2[1];
        code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
      } else {
        code = "" + code + " " + (this.negated ? '==' : '!=') + " null";
      }
      return [this.makeCode(o.level <= LEVEL_COND ? code : "(" + code + ")")];
    };

    return Existence;

  })(Base);

  exports.Parens = Parens = (function(_super) {
    __extends(Parens, _super);

    function Parens(body) {
      this.body = body;
    }

    Parens.prototype.children = ['body'];

    Parens.prototype.unwrap = function() {
      return this.body;
    };

    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };

    Parens.prototype.compileNode = function(o) {
      var bare, expr, fragments;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compileToFragments(o);
      }
      fragments = expr.compileToFragments(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
      if (bare) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    return Parens;

  })(Base);

  exports.For = For = (function(_super) {
    __extends(For, _super);

    function For(body, source) {
      var _ref2;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        _ref2 = [this.index, this.name], this.name = _ref2[0], this.index = _ref2[1];
      }
      if (this.index instanceof Value) {
        this.index.error('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        this.index.error('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        this.name.error('cannot pattern match over range loops');
      }
      if (this.own && !this.object) {
        this.name.error('cannot use own with for-in');
      }
      this.returns = false;
    }

    For.prototype.children = ['body', 'source', 'guard', 'step'];

    For.prototype.compileNode = function(o) {
      var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart, _ref2, _ref3;
      body = Block.wrap([this.body]);
      lastJumps = (_ref2 = last(body.expressions)) != null ? _ref2.jumps() : void 0;
      if (lastJumps && lastJumps instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      if (!this.pattern) {
        name = this.name && (this.name.compile(o, LEVEL_LIST));
      }
      index = this.index && (this.index.compile(o, LEVEL_LIST));
      if (name && !this.pattern) {
        scope.find(name);
      }
      if (index) {
        scope.find(index);
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.object && index) || scope.freeVariable('i');
      kvar = (this.range && name) || index || ivar;
      kvarAssign = kvar !== ivar ? "" + kvar + " = " : "";
      if (this.step && !this.range) {
        _ref3 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST)), step = _ref3[0], stepVar = _ref3[1];
        stepNum = stepVar.match(NUMBER);
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPartFragments = source.compileToFragments(merge(o, {
          index: ivar,
          name: name,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart += "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = "" + name + " = " + svar + "[" + kvar + "]";
        }
        if (!this.object) {
          if (step !== stepVar) {
            defPart += "" + this.tab + step + ";\n";
          }
          if (!(this.step && stepNum && (down = parseNum(stepNum[0]) < 0))) {
            lvar = scope.freeVariable('len');
          }
          declare = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
          declareDown = "" + kvarAssign + ivar + " = " + svar + ".length - 1";
          compare = "" + ivar + " < " + lvar;
          compareDown = "" + ivar + " >= 0";
          if (this.step) {
            if (stepNum) {
              if (down) {
                compare = compareDown;
                declare = declareDown;
              }
            } else {
              compare = "" + stepVar + " > 0 ? " + compare + " : " + compareDown;
              declare = "(" + stepVar + " > 0 ? (" + declare + ") : " + declareDown + ")";
            }
            increment = "" + ivar + " += " + stepVar;
          } else {
            increment = "" + (kvar !== ivar ? "++" + ivar : "" + ivar + "++");
          }
          forPartFragments = [this.makeCode("" + declare + "; " + compare + "; " + kvarAssign + increment)];
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body.makeReturn(rvar);
      }
      if (this.guard) {
        if (body.expressions.length > 1) {
          body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
        } else {
          if (this.guard) {
            body = Block.wrap([new If(this.guard, body)]);
          }
        }
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + kvar + "]")));
      }
      defPartFragments = [].concat(this.makeCode(defPart), this.pluckDirectCall(o, body));
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPartFragments = [this.makeCode("" + kvar + " in " + svar)];
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp')) + ".call(" + svar + ", " + kvar + ")) continue;";
        }
      }
      bodyFragments = body.compileToFragments(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (bodyFragments && (bodyFragments.length > 0)) {
        bodyFragments = [].concat(this.makeCode("\n"), bodyFragments, this.makeCode("\n"));
      }
      return [].concat(defPartFragments, this.makeCode("" + (resultPart || '') + this.tab + "for ("), forPartFragments, this.makeCode(") {" + guardPart + varPart), bodyFragments, this.makeCode("" + this.tab + "}" + (returnResult || '')));
    };

    For.prototype.pluckDirectCall = function(o, body) {
      var base, defs, expr, fn, idx, ref, val, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      defs = [];
      _ref2 = body.expressions;
      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
        expr = _ref2[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = (_ref3 = expr.variable) != null ? _ref3.unwrapAll() : void 0;
        if (!((val instanceof Code) || (val instanceof Value && ((_ref4 = val.base) != null ? _ref4.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref5 = (_ref6 = val.properties[0].name) != null ? _ref6.value : void 0) === 'call' || _ref5 === 'apply')))) {
          continue;
        }
        fn = ((_ref7 = val.base) != null ? _ref7.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          _ref8 = [base, val], val.base = _ref8[0], base = _ref8[1];
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs = defs.concat(this.makeCode(this.tab), new Assign(ref, fn).compileToFragments(o, LEVEL_TOP), this.makeCode(';\n'));
      }
      return defs;
    };

    return For;

  })(While);

  exports.Switch = Switch = (function(_super) {
    __extends(Switch, _super);

    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }

    Switch.prototype.children = ['subject', 'cases', 'otherwise'];

    Switch.prototype.isStatement = YES;

    Switch.prototype.jumps = function(o) {
      var block, conds, jumpNode, _i, _len, _ref2, _ref3, _ref4;
      if (o == null) {
        o = {
          block: true
        };
      }
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], conds = _ref3[0], block = _ref3[1];
        if (jumpNode = block.jumps(o)) {
          return jumpNode;
        }
      }
      return (_ref4 = this.otherwise) != null ? _ref4.jumps(o) : void 0;
    };

    Switch.prototype.makeReturn = function(res) {
      var pair, _i, _len, _ref2, _ref3;
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pair = _ref2[_i];
        pair[1].makeReturn(res);
      }
      if (res) {
        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
      }
      if ((_ref3 = this.otherwise) != null) {
        _ref3.makeReturn(res);
      }
      return this;
    };

    Switch.prototype.compileNode = function(o) {
      var block, body, cond, conditions, expr, fragments, i, idt1, idt2, _i, _j, _len, _len1, _ref2, _ref3, _ref4;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
      _ref2 = this.cases;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        _ref3 = _ref2[i], conditions = _ref3[0], block = _ref3[1];
        _ref4 = flatten([conditions]);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          cond = _ref4[_j];
          if (!this.subject) {
            cond = cond.invert();
          }
          fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
        }
        if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
          fragments = fragments.concat(body, this.makeCode('\n'));
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        fragments.push(cond.makeCode(idt2 + 'break;\n'));
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        fragments.push.apply(fragments, [this.makeCode(idt1 + "default:\n")].concat(__slice.call(this.otherwise.compileToFragments(o, LEVEL_TOP)), [this.makeCode("\n")]));
      }
      fragments.push(this.makeCode(this.tab + '}'));
      return fragments;
    };

    return Switch;

  })(Base);

  exports.If = If = (function(_super) {
    __extends(If, _super);

    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }

    If.prototype.children = ['condition', 'body', 'elseBody'];

    If.prototype.bodyNode = function() {
      var _ref2;
      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function() {
      var _ref2;
      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
    };

    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
        this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
      }
      return this;
    };

    If.prototype.isStatement = function(o) {
      var _ref2;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
    };

    If.prototype.jumps = function(o) {
      var _ref2;
      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
    };

    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };

    If.prototype.makeReturn = function(res) {
      if (res) {
        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
      }
      this.body && (this.body = new Block([this.body.makeReturn(res)]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
      return this;
    };

    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };

    If.prototype.compileStatement = function(o) {
      var answer, body, child, cond, exeq, ifPart, indent;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.condition.invert(), this.elseBodyNode(), {
          type: 'if'
        }).compileToFragments(o);
      }
      indent = o.indent + TAB;
      cond = this.condition.compileToFragments(o, LEVEL_PAREN);
      body = this.ensureBlock(this.body).compileToFragments(merge(o, {
        indent: indent
      }));
      ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode("\n" + this.tab + "}"));
      if (!child) {
        ifPart.unshift(this.makeCode(this.tab));
      }
      if (!this.elseBody) {
        return ifPart;
      }
      answer = ifPart.concat(this.makeCode(' else '));
      if (this.isChain) {
        o.chainChild = true;
        answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
      } else {
        answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {
          indent: indent
        }), LEVEL_TOP), this.makeCode("\n" + this.tab + "}"));
      }
      return answer;
    };

    If.prototype.compileExpression = function(o) {
      var alt, body, cond, fragments;
      cond = this.condition.compileToFragments(o, LEVEL_COND);
      body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
      fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
      if (o.level >= LEVEL_COND) {
        return this.wrapInBraces(fragments);
      } else {
        return fragments;
      }
    };

    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };

    return If;

  })(Base);

  UTILITIES = {
    "extends": function() {
      return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp')) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function() {
      return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function() {
      return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
    },
    modulo: function() {
      return "function(a, b) { return (+a % (b = +b) + b) % b; }";
    },
    hasProp: function() {
      return '{}.hasOwnProperty';
    },
    slice: function() {
      return '[].slice';
    }
  };

  LEVEL_TOP = 1;

  LEVEL_PAREN = 2;

  LEVEL_LIST = 3;

  LEVEL_COND = 4;

  LEVEL_OP = 5;

  LEVEL_ACCESS = 6;

  TAB = '  ';

  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";

  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");

  SIMPLENUM = /^[+-]?\d+$/;

  HEXNUM = /^[+-]?0x[\da-f]+/i;

  NUMBER = /^[+-]?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)$/i;

  METHOD_DEF = RegExp("^(" + IDENTIFIER_STR + ")(\\.prototype)?(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\])$");

  IS_STRING = /^['"]/;

  IS_REGEX = /^\//;

  utility = function(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]());
    return ref;
  };

  multident = function(code, tab) {
    code = code.replace(/\n/g, '$&' + tab);
    return code.replace(/\s+$/, '');
  };

  parseNum = function(x) {
    if (x == null) {
      return 0;
    } else if (x.match(HEXNUM)) {
      return parseInt(x, 16);
    } else {
      return parseFloat(x);
    }
  };

  isLiteralArguments = function(node) {
    return node instanceof Literal && node.value === 'arguments' && !node.asKey;
  };

  isLiteralThis = function(node) {
    return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound) || (node instanceof Call && node.isSuper);
  };

  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };

}).call(this);

},{"./helpers":10,"./lexer":11,"./scope":16}],13:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Line":5,"TERMINATOR":6,"Expression":7,"Statement":8,"Return":9,"Comment":10,"STATEMENT":11,"Value":12,"Invocation":13,"Code":14,"Operation":15,"Assign":16,"If":17,"Try":18,"While":19,"For":20,"Switch":21,"Class":22,"Throw":23,"Block":24,"INDENT":25,"OUTDENT":26,"Identifier":27,"IDENTIFIER":28,"AlphaNumeric":29,"NUMBER":30,"STRING":31,"Literal":32,"JS":33,"REGEX":34,"DEBUGGER":35,"UNDEFINED":36,"NULL":37,"BOOL":38,"Assignable":39,"=":40,"AssignObj":41,"ObjAssignable":42,":":43,"ThisProperty":44,"RETURN":45,"HERECOMMENT":46,"PARAM_START":47,"ParamList":48,"PARAM_END":49,"FuncGlyph":50,"->":51,"=>":52,"OptComma":53,",":54,"Param":55,"ParamVar":56,"...":57,"Array":58,"Object":59,"Splat":60,"SimpleAssignable":61,"Accessor":62,"Parenthetical":63,"Range":64,"This":65,".":66,"?.":67,"::":68,"?::":69,"Index":70,"INDEX_START":71,"IndexValue":72,"INDEX_END":73,"INDEX_SOAK":74,"Slice":75,"{":76,"AssignList":77,"}":78,"CLASS":79,"EXTENDS":80,"OptFuncExist":81,"Arguments":82,"SUPER":83,"FUNC_EXIST":84,"CALL_START":85,"CALL_END":86,"ArgList":87,"THIS":88,"@":89,"[":90,"]":91,"RangeDots":92,"..":93,"Arg":94,"SimpleArgs":95,"TRY":96,"Catch":97,"FINALLY":98,"CATCH":99,"THROW":100,"(":101,")":102,"WhileSource":103,"WHILE":104,"WHEN":105,"UNTIL":106,"Loop":107,"LOOP":108,"ForBody":109,"FOR":110,"ForStart":111,"ForSource":112,"ForVariables":113,"OWN":114,"ForValue":115,"FORIN":116,"FOROF":117,"BY":118,"SWITCH":119,"Whens":120,"ELSE":121,"When":122,"LEADING_WHEN":123,"IfBlock":124,"IF":125,"POST_IF":126,"UNARY":127,"UNARY_MATH":128,"-":129,"+":130,"--":131,"++":132,"?":133,"MATH":134,"**":135,"SHIFT":136,"COMPARE":137,"LOGIC":138,"RELATION":139,"COMPOUND_ASSIGN":140,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",11:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"DEBUGGER",36:"UNDEFINED",37:"NULL",38:"BOOL",40:"=",43:":",45:"RETURN",46:"HERECOMMENT",47:"PARAM_START",49:"PARAM_END",51:"->",52:"=>",54:",",57:"...",66:".",67:"?.",68:"::",69:"?::",71:"INDEX_START",73:"INDEX_END",74:"INDEX_SOAK",76:"{",78:"}",79:"CLASS",80:"EXTENDS",83:"SUPER",84:"FUNC_EXIST",85:"CALL_START",86:"CALL_END",88:"THIS",89:"@",90:"[",91:"]",93:"..",96:"TRY",98:"FINALLY",99:"CATCH",100:"THROW",101:"(",102:")",104:"WHILE",105:"WHEN",106:"UNTIL",108:"LOOP",110:"FOR",114:"OWN",116:"FORIN",117:"FOROF",118:"BY",119:"SWITCH",121:"ELSE",123:"LEADING_WHEN",125:"IF",126:"POST_IF",127:"UNARY",128:"UNARY_MATH",129:"-",130:"+",131:"--",132:"++",133:"?",134:"MATH",135:"**",136:"SHIFT",137:"COMPARE",138:"LOGIC",139:"RELATION",140:"COMPOUND_ASSIGN"},
productions_: [0,[3,0],[3,1],[4,1],[4,3],[4,2],[5,1],[5,1],[8,1],[8,1],[8,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[24,2],[24,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[16,3],[16,4],[16,5],[41,1],[41,3],[41,5],[41,1],[42,1],[42,1],[42,1],[9,2],[9,1],[10,1],[14,5],[14,2],[50,1],[50,1],[53,0],[53,1],[48,0],[48,1],[48,3],[48,4],[48,6],[55,1],[55,2],[55,3],[55,1],[56,1],[56,1],[56,1],[56,1],[60,2],[61,1],[61,2],[61,2],[61,1],[39,1],[39,1],[39,1],[12,1],[12,1],[12,1],[12,1],[12,1],[62,2],[62,2],[62,2],[62,2],[62,1],[62,1],[70,3],[70,2],[72,1],[72,1],[59,4],[77,0],[77,1],[77,3],[77,4],[77,6],[22,1],[22,2],[22,3],[22,4],[22,2],[22,3],[22,4],[22,5],[13,3],[13,3],[13,1],[13,2],[81,0],[81,1],[82,2],[82,4],[65,1],[65,1],[44,2],[58,2],[58,4],[92,1],[92,1],[64,5],[75,3],[75,2],[75,2],[75,1],[87,1],[87,3],[87,4],[87,4],[87,6],[94,1],[94,1],[94,1],[95,1],[95,3],[18,2],[18,3],[18,4],[18,5],[97,3],[97,3],[97,2],[23,2],[63,3],[63,5],[103,2],[103,4],[103,2],[103,4],[19,2],[19,2],[19,2],[19,1],[107,2],[107,2],[20,2],[20,2],[20,2],[109,2],[109,2],[111,2],[111,3],[115,1],[115,1],[115,1],[115,1],[113,1],[113,3],[112,2],[112,2],[112,4],[112,4],[112,4],[112,6],[112,6],[21,5],[21,7],[21,4],[21,6],[120,1],[120,2],[122,3],[122,4],[124,3],[124,5],[17,1],[17,3],[17,3],[17,3],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,5],[15,4],[15,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:return this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Block);
break;
case 2:return this.$ = $$[$0];
break;
case 3:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(yy.Block.wrap([$$[$0]]));
break;
case 4:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].push($$[$0]));
break;
case 5:this.$ = $$[$0-1];
break;
case 6:this.$ = $$[$0];
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = $$[$0];
break;
case 9:this.$ = $$[$0];
break;
case 10:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 11:this.$ = $$[$0];
break;
case 12:this.$ = $$[$0];
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:this.$ = $$[$0];
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = $$[$0];
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = $$[$0];
break;
case 22:this.$ = $$[$0];
break;
case 23:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Block);
break;
case 24:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-1]);
break;
case 25:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 26:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 27:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 28:this.$ = $$[$0];
break;
case 29:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 30:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 31:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 32:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Undefined);
break;
case 33:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Null);
break;
case 34:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Bool($$[$0]));
break;
case 35:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0]));
break;
case 36:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0]));
break;
case 37:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1]));
break;
case 38:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 39:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-2])(new yy.Value($$[$0-2])), $$[$0], 'object'));
break;
case 40:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-4])(new yy.Value($$[$0-4])), $$[$0-1], 'object'));
break;
case 41:this.$ = $$[$0];
break;
case 42:this.$ = $$[$0];
break;
case 43:this.$ = $$[$0];
break;
case 44:this.$ = $$[$0];
break;
case 45:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Return($$[$0]));
break;
case 46:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Return);
break;
case 47:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Comment($$[$0]));
break;
case 48:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Code($$[$0-3], $$[$0], $$[$0-1]));
break;
case 49:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Code([], $$[$0], $$[$0-1]));
break;
case 50:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('func');
break;
case 51:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('boundfunc');
break;
case 52:this.$ = $$[$0];
break;
case 53:this.$ = $$[$0];
break;
case 54:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
break;
case 55:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
break;
case 56:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
break;
case 57:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
break;
case 58:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
break;
case 59:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Param($$[$0]));
break;
case 60:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Param($$[$0-1], null, true));
break;
case 61:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Param($$[$0-2], $$[$0]));
break;
case 62:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Expansion);
break;
case 63:this.$ = $$[$0];
break;
case 64:this.$ = $$[$0];
break;
case 65:this.$ = $$[$0];
break;
case 66:this.$ = $$[$0];
break;
case 67:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Splat($$[$0-1]));
break;
case 68:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 69:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].add($$[$0]));
break;
case 70:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value($$[$0-1], [].concat($$[$0])));
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = $$[$0];
break;
case 73:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 74:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 75:this.$ = $$[$0];
break;
case 76:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 77:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 78:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 79:this.$ = $$[$0];
break;
case 80:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0]));
break;
case 81:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0], 'soak'));
break;
case 82:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'))), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
break;
case 83:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'), 'soak')), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
break;
case 84:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Access(new yy.Literal('prototype')));
break;
case 85:this.$ = $$[$0];
break;
case 86:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-1]);
break;
case 87:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(yy.extend($$[$0], {
          soak: true
        }));
break;
case 88:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Index($$[$0]));
break;
case 89:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Slice($$[$0]));
break;
case 90:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Obj($$[$0-2], $$[$0-3].generated));
break;
case 91:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
break;
case 92:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
break;
case 93:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
break;
case 94:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
break;
case 95:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
break;
case 96:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Class);
break;
case 97:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class(null, null, $$[$0]));
break;
case 98:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class(null, $$[$0]));
break;
case 99:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class(null, $$[$0-1], $$[$0]));
break;
case 100:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class($$[$0]));
break;
case 101:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class($$[$0-1], null, $$[$0]));
break;
case 102:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class($$[$0-2], $$[$0]));
break;
case 103:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Class($$[$0-3], $$[$0-1], $$[$0]));
break;
case 104:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Call($$[$0-2], $$[$0], $$[$0-1]));
break;
case 105:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Call($$[$0-2], $$[$0], $$[$0-1]));
break;
case 106:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]));
break;
case 107:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Call('super', $$[$0]));
break;
case 108:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(false);
break;
case 109:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(true);
break;
case 110:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([]);
break;
case 111:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-2]);
break;
case 112:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
break;
case 113:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
break;
case 114:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('this')), [yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))], 'this'));
break;
case 115:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Arr([]));
break;
case 116:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Arr($$[$0-2]));
break;
case 117:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('inclusive');
break;
case 118:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('exclusive');
break;
case 119:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]));
break;
case 120:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Range($$[$0-2], $$[$0], $$[$0-1]));
break;
case 121:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range($$[$0-1], null, $$[$0]));
break;
case 122:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range(null, $$[$0], $$[$0-1]));
break;
case 123:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Range(null, null, $$[$0]));
break;
case 124:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
break;
case 125:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
break;
case 126:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
break;
case 127:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-2]);
break;
case 128:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
break;
case 129:this.$ = $$[$0];
break;
case 130:this.$ = $$[$0];
break;
case 131:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Expansion);
break;
case 132:this.$ = $$[$0];
break;
case 133:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([].concat($$[$0-2], $$[$0]));
break;
case 134:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Try($$[$0]));
break;
case 135:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]));
break;
case 136:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Try($$[$0-2], null, null, $$[$0]));
break;
case 137:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]));
break;
case 138:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-1], $$[$0]]);
break;
case 139:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Value($$[$0-1])), $$[$0]]);
break;
case 140:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([null, $$[$0]]);
break;
case 141:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Throw($$[$0]));
break;
case 142:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Parens($$[$0-1]));
break;
case 143:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Parens($$[$0-2]));
break;
case 144:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0]));
break;
case 145:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
          guard: $$[$0]
        }));
break;
case 146:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0], {
          invert: true
        }));
break;
case 147:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
          invert: true,
          guard: $$[$0]
        }));
break;
case 148:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].addBody($$[$0]));
break;
case 149:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0-1])(yy.Block.wrap([$$[$0-1]]))));
break;
case 150:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0-1])(yy.Block.wrap([$$[$0-1]]))));
break;
case 151:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])($$[$0]);
break;
case 152:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody($$[$0]));
break;
case 153:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody(yy.addLocationDataFn(_$[$0])(yy.Block.wrap([$$[$0]]))));
break;
case 154:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0-1], $$[$0]));
break;
case 155:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0-1], $$[$0]));
break;
case 156:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0], $$[$0-1]));
break;
case 157:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: yy.addLocationDataFn(_$[$0])(new yy.Value($$[$0]))
        });
break;
case 158:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])((function () {
        $$[$0].own = $$[$0-1].own;
        $$[$0].name = $$[$0-1][0];
        $$[$0].index = $$[$0-1][1];
        return $$[$0];
      }()));
break;
case 159:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0]);
break;
case 160:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
        $$[$0].own = true;
        return $$[$0];
      }()));
break;
case 161:this.$ = $$[$0];
break;
case 162:this.$ = $$[$0];
break;
case 163:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 164:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 165:this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
break;
case 166:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-2], $$[$0]]);
break;
case 167:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: $$[$0]
        });
break;
case 168:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: $$[$0],
          object: true
        });
break;
case 169:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          guard: $$[$0]
        });
break;
case 170:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          guard: $$[$0],
          object: true
        });
break;
case 171:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          step: $$[$0]
        });
break;
case 172:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
          source: $$[$0-4],
          guard: $$[$0-2],
          step: $$[$0]
        });
break;
case 173:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
          source: $$[$0-4],
          step: $$[$0-2],
          guard: $$[$0]
        });
break;
case 174:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Switch($$[$0-3], $$[$0-1]));
break;
case 175:this.$ = yy.addLocationDataFn(_$[$0-6], _$[$0])(new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]));
break;
case 176:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Switch(null, $$[$0-1]));
break;
case 177:this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])(new yy.Switch(null, $$[$0-3], $$[$0-1]));
break;
case 178:this.$ = $$[$0];
break;
case 179:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].concat($$[$0]));
break;
case 180:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([[$$[$0-1], $$[$0]]]);
break;
case 181:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])([[$$[$0-2], $$[$0-1]]]);
break;
case 182:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }));
break;
case 183:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])($$[$0-4].addElse(yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }))));
break;
case 184:this.$ = $$[$0];
break;
case 185:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].addElse($$[$0]));
break;
case 186:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0-2])(yy.Block.wrap([$$[$0-2]])), {
          type: $$[$0-1],
          statement: true
        }));
break;
case 187:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0-2])(yy.Block.wrap([$$[$0-2]])), {
          type: $$[$0-1],
          statement: true
        }));
break;
case 188:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op($$[$0-1], $$[$0]));
break;
case 189:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op($$[$0-1], $$[$0]));
break;
case 190:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('-', $$[$0]));
break;
case 191:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('+', $$[$0]));
break;
case 192:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0]));
break;
case 193:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0]));
break;
case 194:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0-1], null, true));
break;
case 195:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0-1], null, true));
break;
case 196:this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Existence($$[$0-1]));
break;
case 197:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('+', $$[$0-2], $$[$0]));
break;
case 198:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('-', $$[$0-2], $$[$0]));
break;
case 199:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 200:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 201:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 202:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 203:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 204:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
        if ($$[$0-1].charAt(0) === '!') {
          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
        } else {
          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
        }
      }()));
break;
case 205:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0], $$[$0-1]));
break;
case 206:this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]));
break;
case 207:this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0], $$[$0-2]));
break;
case 208:this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Extends($$[$0-2], $$[$0]));
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[3]},{1:[2,2],6:[1,73]},{1:[2,3],6:[2,3],26:[2,3],102:[2,3]},{1:[2,6],6:[2,6],26:[2,6],102:[2,6],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,7],6:[2,7],26:[2,7],102:[2,7],103:87,104:[1,64],106:[1,65],109:88,110:[1,67],111:68,126:[1,86]},{1:[2,11],6:[2,11],25:[2,11],26:[2,11],49:[2,11],54:[2,11],57:[2,11],62:90,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],73:[2,11],74:[1,98],78:[2,11],81:89,84:[1,91],85:[2,108],86:[2,11],91:[2,11],93:[2,11],102:[2,11],104:[2,11],105:[2,11],106:[2,11],110:[2,11],118:[2,11],126:[2,11],129:[2,11],130:[2,11],133:[2,11],134:[2,11],135:[2,11],136:[2,11],137:[2,11],138:[2,11],139:[2,11]},{1:[2,12],6:[2,12],25:[2,12],26:[2,12],49:[2,12],54:[2,12],57:[2,12],62:100,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],73:[2,12],74:[1,98],78:[2,12],81:99,84:[1,91],85:[2,108],86:[2,12],91:[2,12],93:[2,12],102:[2,12],104:[2,12],105:[2,12],106:[2,12],110:[2,12],118:[2,12],126:[2,12],129:[2,12],130:[2,12],133:[2,12],134:[2,12],135:[2,12],136:[2,12],137:[2,12],138:[2,12],139:[2,12]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],49:[2,13],54:[2,13],57:[2,13],73:[2,13],78:[2,13],86:[2,13],91:[2,13],93:[2,13],102:[2,13],104:[2,13],105:[2,13],106:[2,13],110:[2,13],118:[2,13],126:[2,13],129:[2,13],130:[2,13],133:[2,13],134:[2,13],135:[2,13],136:[2,13],137:[2,13],138:[2,13],139:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],49:[2,14],54:[2,14],57:[2,14],73:[2,14],78:[2,14],86:[2,14],91:[2,14],93:[2,14],102:[2,14],104:[2,14],105:[2,14],106:[2,14],110:[2,14],118:[2,14],126:[2,14],129:[2,14],130:[2,14],133:[2,14],134:[2,14],135:[2,14],136:[2,14],137:[2,14],138:[2,14],139:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],49:[2,15],54:[2,15],57:[2,15],73:[2,15],78:[2,15],86:[2,15],91:[2,15],93:[2,15],102:[2,15],104:[2,15],105:[2,15],106:[2,15],110:[2,15],118:[2,15],126:[2,15],129:[2,15],130:[2,15],133:[2,15],134:[2,15],135:[2,15],136:[2,15],137:[2,15],138:[2,15],139:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],49:[2,16],54:[2,16],57:[2,16],73:[2,16],78:[2,16],86:[2,16],91:[2,16],93:[2,16],102:[2,16],104:[2,16],105:[2,16],106:[2,16],110:[2,16],118:[2,16],126:[2,16],129:[2,16],130:[2,16],133:[2,16],134:[2,16],135:[2,16],136:[2,16],137:[2,16],138:[2,16],139:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],49:[2,17],54:[2,17],57:[2,17],73:[2,17],78:[2,17],86:[2,17],91:[2,17],93:[2,17],102:[2,17],104:[2,17],105:[2,17],106:[2,17],110:[2,17],118:[2,17],126:[2,17],129:[2,17],130:[2,17],133:[2,17],134:[2,17],135:[2,17],136:[2,17],137:[2,17],138:[2,17],139:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],49:[2,18],54:[2,18],57:[2,18],73:[2,18],78:[2,18],86:[2,18],91:[2,18],93:[2,18],102:[2,18],104:[2,18],105:[2,18],106:[2,18],110:[2,18],118:[2,18],126:[2,18],129:[2,18],130:[2,18],133:[2,18],134:[2,18],135:[2,18],136:[2,18],137:[2,18],138:[2,18],139:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],49:[2,19],54:[2,19],57:[2,19],73:[2,19],78:[2,19],86:[2,19],91:[2,19],93:[2,19],102:[2,19],104:[2,19],105:[2,19],106:[2,19],110:[2,19],118:[2,19],126:[2,19],129:[2,19],130:[2,19],133:[2,19],134:[2,19],135:[2,19],136:[2,19],137:[2,19],138:[2,19],139:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],49:[2,20],54:[2,20],57:[2,20],73:[2,20],78:[2,20],86:[2,20],91:[2,20],93:[2,20],102:[2,20],104:[2,20],105:[2,20],106:[2,20],110:[2,20],118:[2,20],126:[2,20],129:[2,20],130:[2,20],133:[2,20],134:[2,20],135:[2,20],136:[2,20],137:[2,20],138:[2,20],139:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],49:[2,21],54:[2,21],57:[2,21],73:[2,21],78:[2,21],86:[2,21],91:[2,21],93:[2,21],102:[2,21],104:[2,21],105:[2,21],106:[2,21],110:[2,21],118:[2,21],126:[2,21],129:[2,21],130:[2,21],133:[2,21],134:[2,21],135:[2,21],136:[2,21],137:[2,21],138:[2,21],139:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],49:[2,22],54:[2,22],57:[2,22],73:[2,22],78:[2,22],86:[2,22],91:[2,22],93:[2,22],102:[2,22],104:[2,22],105:[2,22],106:[2,22],110:[2,22],118:[2,22],126:[2,22],129:[2,22],130:[2,22],133:[2,22],134:[2,22],135:[2,22],136:[2,22],137:[2,22],138:[2,22],139:[2,22]},{1:[2,8],6:[2,8],26:[2,8],102:[2,8],104:[2,8],106:[2,8],110:[2,8],126:[2,8]},{1:[2,9],6:[2,9],26:[2,9],102:[2,9],104:[2,9],106:[2,9],110:[2,9],126:[2,9]},{1:[2,10],6:[2,10],26:[2,10],102:[2,10],104:[2,10],106:[2,10],110:[2,10],126:[2,10]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],40:[1,101],49:[2,75],54:[2,75],57:[2,75],66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],73:[2,75],74:[2,75],78:[2,75],84:[2,75],85:[2,75],86:[2,75],91:[2,75],93:[2,75],102:[2,75],104:[2,75],105:[2,75],106:[2,75],110:[2,75],118:[2,75],126:[2,75],129:[2,75],130:[2,75],133:[2,75],134:[2,75],135:[2,75],136:[2,75],137:[2,75],138:[2,75],139:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],49:[2,76],54:[2,76],57:[2,76],66:[2,76],67:[2,76],68:[2,76],69:[2,76],71:[2,76],73:[2,76],74:[2,76],78:[2,76],84:[2,76],85:[2,76],86:[2,76],91:[2,76],93:[2,76],102:[2,76],104:[2,76],105:[2,76],106:[2,76],110:[2,76],118:[2,76],126:[2,76],129:[2,76],130:[2,76],133:[2,76],134:[2,76],135:[2,76],136:[2,76],137:[2,76],138:[2,76],139:[2,76]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],49:[2,77],54:[2,77],57:[2,77],66:[2,77],67:[2,77],68:[2,77],69:[2,77],71:[2,77],73:[2,77],74:[2,77],78:[2,77],84:[2,77],85:[2,77],86:[2,77],91:[2,77],93:[2,77],102:[2,77],104:[2,77],105:[2,77],106:[2,77],110:[2,77],118:[2,77],126:[2,77],129:[2,77],130:[2,77],133:[2,77],134:[2,77],135:[2,77],136:[2,77],137:[2,77],138:[2,77],139:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],49:[2,78],54:[2,78],57:[2,78],66:[2,78],67:[2,78],68:[2,78],69:[2,78],71:[2,78],73:[2,78],74:[2,78],78:[2,78],84:[2,78],85:[2,78],86:[2,78],91:[2,78],93:[2,78],102:[2,78],104:[2,78],105:[2,78],106:[2,78],110:[2,78],118:[2,78],126:[2,78],129:[2,78],130:[2,78],133:[2,78],134:[2,78],135:[2,78],136:[2,78],137:[2,78],138:[2,78],139:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],49:[2,79],54:[2,79],57:[2,79],66:[2,79],67:[2,79],68:[2,79],69:[2,79],71:[2,79],73:[2,79],74:[2,79],78:[2,79],84:[2,79],85:[2,79],86:[2,79],91:[2,79],93:[2,79],102:[2,79],104:[2,79],105:[2,79],106:[2,79],110:[2,79],118:[2,79],126:[2,79],129:[2,79],130:[2,79],133:[2,79],134:[2,79],135:[2,79],136:[2,79],137:[2,79],138:[2,79],139:[2,79]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],49:[2,106],54:[2,106],57:[2,106],66:[2,106],67:[2,106],68:[2,106],69:[2,106],71:[2,106],73:[2,106],74:[2,106],78:[2,106],82:102,84:[2,106],85:[1,103],86:[2,106],91:[2,106],93:[2,106],102:[2,106],104:[2,106],105:[2,106],106:[2,106],110:[2,106],118:[2,106],126:[2,106],129:[2,106],130:[2,106],133:[2,106],134:[2,106],135:[2,106],136:[2,106],137:[2,106],138:[2,106],139:[2,106]},{6:[2,54],25:[2,54],27:108,28:[1,72],44:109,48:104,49:[2,54],54:[2,54],55:105,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{24:114,25:[1,115]},{7:116,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:118,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:119,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:120,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{12:122,13:123,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,58:46,59:47,61:121,63:23,64:24,65:25,76:[1,69],83:[1,26],88:[1,57],89:[1,58],90:[1,56],101:[1,55]},{12:122,13:123,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,58:46,59:47,61:125,63:23,64:24,65:25,76:[1,69],83:[1,26],88:[1,57],89:[1,58],90:[1,56],101:[1,55]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],40:[2,72],49:[2,72],54:[2,72],57:[2,72],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,72],74:[2,72],78:[2,72],80:[1,129],84:[2,72],85:[2,72],86:[2,72],91:[2,72],93:[2,72],102:[2,72],104:[2,72],105:[2,72],106:[2,72],110:[2,72],118:[2,72],126:[2,72],129:[2,72],130:[2,72],131:[1,126],132:[1,127],133:[2,72],134:[2,72],135:[2,72],136:[2,72],137:[2,72],138:[2,72],139:[2,72],140:[1,128]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],49:[2,184],54:[2,184],57:[2,184],73:[2,184],78:[2,184],86:[2,184],91:[2,184],93:[2,184],102:[2,184],104:[2,184],105:[2,184],106:[2,184],110:[2,184],118:[2,184],121:[1,130],126:[2,184],129:[2,184],130:[2,184],133:[2,184],134:[2,184],135:[2,184],136:[2,184],137:[2,184],138:[2,184],139:[2,184]},{24:131,25:[1,115]},{24:132,25:[1,115]},{1:[2,151],6:[2,151],25:[2,151],26:[2,151],49:[2,151],54:[2,151],57:[2,151],73:[2,151],78:[2,151],86:[2,151],91:[2,151],93:[2,151],102:[2,151],104:[2,151],105:[2,151],106:[2,151],110:[2,151],118:[2,151],126:[2,151],129:[2,151],130:[2,151],133:[2,151],134:[2,151],135:[2,151],136:[2,151],137:[2,151],138:[2,151],139:[2,151]},{24:133,25:[1,115]},{7:134,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,135],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,96],6:[2,96],12:122,13:123,24:136,25:[1,115],26:[2,96],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:124,44:62,49:[2,96],54:[2,96],57:[2,96],58:46,59:47,61:138,63:23,64:24,65:25,73:[2,96],76:[1,69],78:[2,96],80:[1,137],83:[1,26],86:[2,96],88:[1,57],89:[1,58],90:[1,56],91:[2,96],93:[2,96],101:[1,55],102:[2,96],104:[2,96],105:[2,96],106:[2,96],110:[2,96],118:[2,96],126:[2,96],129:[2,96],130:[2,96],133:[2,96],134:[2,96],135:[2,96],136:[2,96],137:[2,96],138:[2,96],139:[2,96]},{7:139,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,46],6:[2,46],7:140,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[2,46],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],102:[2,46],103:38,104:[2,46],106:[2,46],107:39,108:[1,66],109:40,110:[2,46],111:68,119:[1,41],124:36,125:[1,63],126:[2,46],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,47],6:[2,47],25:[2,47],26:[2,47],54:[2,47],78:[2,47],102:[2,47],104:[2,47],106:[2,47],110:[2,47],126:[2,47]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],40:[2,73],49:[2,73],54:[2,73],57:[2,73],66:[2,73],67:[2,73],68:[2,73],69:[2,73],71:[2,73],73:[2,73],74:[2,73],78:[2,73],84:[2,73],85:[2,73],86:[2,73],91:[2,73],93:[2,73],102:[2,73],104:[2,73],105:[2,73],106:[2,73],110:[2,73],118:[2,73],126:[2,73],129:[2,73],130:[2,73],133:[2,73],134:[2,73],135:[2,73],136:[2,73],137:[2,73],138:[2,73],139:[2,73]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],40:[2,74],49:[2,74],54:[2,74],57:[2,74],66:[2,74],67:[2,74],68:[2,74],69:[2,74],71:[2,74],73:[2,74],74:[2,74],78:[2,74],84:[2,74],85:[2,74],86:[2,74],91:[2,74],93:[2,74],102:[2,74],104:[2,74],105:[2,74],106:[2,74],110:[2,74],118:[2,74],126:[2,74],129:[2,74],130:[2,74],133:[2,74],134:[2,74],135:[2,74],136:[2,74],137:[2,74],138:[2,74],139:[2,74]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],49:[2,28],54:[2,28],57:[2,28],66:[2,28],67:[2,28],68:[2,28],69:[2,28],71:[2,28],73:[2,28],74:[2,28],78:[2,28],84:[2,28],85:[2,28],86:[2,28],91:[2,28],93:[2,28],102:[2,28],104:[2,28],105:[2,28],106:[2,28],110:[2,28],118:[2,28],126:[2,28],129:[2,28],130:[2,28],133:[2,28],134:[2,28],135:[2,28],136:[2,28],137:[2,28],138:[2,28],139:[2,28]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],49:[2,29],54:[2,29],57:[2,29],66:[2,29],67:[2,29],68:[2,29],69:[2,29],71:[2,29],73:[2,29],74:[2,29],78:[2,29],84:[2,29],85:[2,29],86:[2,29],91:[2,29],93:[2,29],102:[2,29],104:[2,29],105:[2,29],106:[2,29],110:[2,29],118:[2,29],126:[2,29],129:[2,29],130:[2,29],133:[2,29],134:[2,29],135:[2,29],136:[2,29],137:[2,29],138:[2,29],139:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],49:[2,30],54:[2,30],57:[2,30],66:[2,30],67:[2,30],68:[2,30],69:[2,30],71:[2,30],73:[2,30],74:[2,30],78:[2,30],84:[2,30],85:[2,30],86:[2,30],91:[2,30],93:[2,30],102:[2,30],104:[2,30],105:[2,30],106:[2,30],110:[2,30],118:[2,30],126:[2,30],129:[2,30],130:[2,30],133:[2,30],134:[2,30],135:[2,30],136:[2,30],137:[2,30],138:[2,30],139:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],49:[2,31],54:[2,31],57:[2,31],66:[2,31],67:[2,31],68:[2,31],69:[2,31],71:[2,31],73:[2,31],74:[2,31],78:[2,31],84:[2,31],85:[2,31],86:[2,31],91:[2,31],93:[2,31],102:[2,31],104:[2,31],105:[2,31],106:[2,31],110:[2,31],118:[2,31],126:[2,31],129:[2,31],130:[2,31],133:[2,31],134:[2,31],135:[2,31],136:[2,31],137:[2,31],138:[2,31],139:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],49:[2,32],54:[2,32],57:[2,32],66:[2,32],67:[2,32],68:[2,32],69:[2,32],71:[2,32],73:[2,32],74:[2,32],78:[2,32],84:[2,32],85:[2,32],86:[2,32],91:[2,32],93:[2,32],102:[2,32],104:[2,32],105:[2,32],106:[2,32],110:[2,32],118:[2,32],126:[2,32],129:[2,32],130:[2,32],133:[2,32],134:[2,32],135:[2,32],136:[2,32],137:[2,32],138:[2,32],139:[2,32]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],49:[2,33],54:[2,33],57:[2,33],66:[2,33],67:[2,33],68:[2,33],69:[2,33],71:[2,33],73:[2,33],74:[2,33],78:[2,33],84:[2,33],85:[2,33],86:[2,33],91:[2,33],93:[2,33],102:[2,33],104:[2,33],105:[2,33],106:[2,33],110:[2,33],118:[2,33],126:[2,33],129:[2,33],130:[2,33],133:[2,33],134:[2,33],135:[2,33],136:[2,33],137:[2,33],138:[2,33],139:[2,33]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],49:[2,34],54:[2,34],57:[2,34],66:[2,34],67:[2,34],68:[2,34],69:[2,34],71:[2,34],73:[2,34],74:[2,34],78:[2,34],84:[2,34],85:[2,34],86:[2,34],91:[2,34],93:[2,34],102:[2,34],104:[2,34],105:[2,34],106:[2,34],110:[2,34],118:[2,34],126:[2,34],129:[2,34],130:[2,34],133:[2,34],134:[2,34],135:[2,34],136:[2,34],137:[2,34],138:[2,34],139:[2,34]},{4:141,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,142],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:143,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:145,88:[1,57],89:[1,58],90:[1,56],91:[1,144],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],49:[2,112],54:[2,112],57:[2,112],66:[2,112],67:[2,112],68:[2,112],69:[2,112],71:[2,112],73:[2,112],74:[2,112],78:[2,112],84:[2,112],85:[2,112],86:[2,112],91:[2,112],93:[2,112],102:[2,112],104:[2,112],105:[2,112],106:[2,112],110:[2,112],118:[2,112],126:[2,112],129:[2,112],130:[2,112],133:[2,112],134:[2,112],135:[2,112],136:[2,112],137:[2,112],138:[2,112],139:[2,112]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],27:150,28:[1,72],49:[2,113],54:[2,113],57:[2,113],66:[2,113],67:[2,113],68:[2,113],69:[2,113],71:[2,113],73:[2,113],74:[2,113],78:[2,113],84:[2,113],85:[2,113],86:[2,113],91:[2,113],93:[2,113],102:[2,113],104:[2,113],105:[2,113],106:[2,113],110:[2,113],118:[2,113],126:[2,113],129:[2,113],130:[2,113],133:[2,113],134:[2,113],135:[2,113],136:[2,113],137:[2,113],138:[2,113],139:[2,113]},{25:[2,50]},{25:[2,51]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],40:[2,68],49:[2,68],54:[2,68],57:[2,68],66:[2,68],67:[2,68],68:[2,68],69:[2,68],71:[2,68],73:[2,68],74:[2,68],78:[2,68],80:[2,68],84:[2,68],85:[2,68],86:[2,68],91:[2,68],93:[2,68],102:[2,68],104:[2,68],105:[2,68],106:[2,68],110:[2,68],118:[2,68],126:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68],135:[2,68],136:[2,68],137:[2,68],138:[2,68],139:[2,68],140:[2,68]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],40:[2,71],49:[2,71],54:[2,71],57:[2,71],66:[2,71],67:[2,71],68:[2,71],69:[2,71],71:[2,71],73:[2,71],74:[2,71],78:[2,71],80:[2,71],84:[2,71],85:[2,71],86:[2,71],91:[2,71],93:[2,71],102:[2,71],104:[2,71],105:[2,71],106:[2,71],110:[2,71],118:[2,71],126:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71],138:[2,71],139:[2,71],140:[2,71]},{7:151,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:152,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:153,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:155,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:154,25:[1,115],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{27:160,28:[1,72],44:161,58:162,59:163,64:156,76:[1,69],89:[1,112],90:[1,56],113:157,114:[1,158],115:159},{112:164,116:[1,165],117:[1,166]},{6:[2,91],10:170,25:[2,91],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:168,42:169,44:173,46:[1,45],54:[2,91],77:167,78:[2,91],89:[1,112]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],43:[2,26],49:[2,26],54:[2,26],57:[2,26],66:[2,26],67:[2,26],68:[2,26],69:[2,26],71:[2,26],73:[2,26],74:[2,26],78:[2,26],84:[2,26],85:[2,26],86:[2,26],91:[2,26],93:[2,26],102:[2,26],104:[2,26],105:[2,26],106:[2,26],110:[2,26],118:[2,26],126:[2,26],129:[2,26],130:[2,26],133:[2,26],134:[2,26],135:[2,26],136:[2,26],137:[2,26],138:[2,26],139:[2,26]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],43:[2,27],49:[2,27],54:[2,27],57:[2,27],66:[2,27],67:[2,27],68:[2,27],69:[2,27],71:[2,27],73:[2,27],74:[2,27],78:[2,27],84:[2,27],85:[2,27],86:[2,27],91:[2,27],93:[2,27],102:[2,27],104:[2,27],105:[2,27],106:[2,27],110:[2,27],118:[2,27],126:[2,27],129:[2,27],130:[2,27],133:[2,27],134:[2,27],135:[2,27],136:[2,27],137:[2,27],138:[2,27],139:[2,27]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],40:[2,25],43:[2,25],49:[2,25],54:[2,25],57:[2,25],66:[2,25],67:[2,25],68:[2,25],69:[2,25],71:[2,25],73:[2,25],74:[2,25],78:[2,25],80:[2,25],84:[2,25],85:[2,25],86:[2,25],91:[2,25],93:[2,25],102:[2,25],104:[2,25],105:[2,25],106:[2,25],110:[2,25],116:[2,25],117:[2,25],118:[2,25],126:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25],134:[2,25],135:[2,25],136:[2,25],137:[2,25],138:[2,25],139:[2,25],140:[2,25]},{1:[2,5],5:174,6:[2,5],7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[2,5],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],102:[2,5],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,196],6:[2,196],25:[2,196],26:[2,196],49:[2,196],54:[2,196],57:[2,196],73:[2,196],78:[2,196],86:[2,196],91:[2,196],93:[2,196],102:[2,196],104:[2,196],105:[2,196],106:[2,196],110:[2,196],118:[2,196],126:[2,196],129:[2,196],130:[2,196],133:[2,196],134:[2,196],135:[2,196],136:[2,196],137:[2,196],138:[2,196],139:[2,196]},{7:175,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:176,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:177,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:178,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:179,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:180,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:181,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:182,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:183,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,150],6:[2,150],25:[2,150],26:[2,150],49:[2,150],54:[2,150],57:[2,150],73:[2,150],78:[2,150],86:[2,150],91:[2,150],93:[2,150],102:[2,150],104:[2,150],105:[2,150],106:[2,150],110:[2,150],118:[2,150],126:[2,150],129:[2,150],130:[2,150],133:[2,150],134:[2,150],135:[2,150],136:[2,150],137:[2,150],138:[2,150],139:[2,150]},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],49:[2,155],54:[2,155],57:[2,155],73:[2,155],78:[2,155],86:[2,155],91:[2,155],93:[2,155],102:[2,155],104:[2,155],105:[2,155],106:[2,155],110:[2,155],118:[2,155],126:[2,155],129:[2,155],130:[2,155],133:[2,155],134:[2,155],135:[2,155],136:[2,155],137:[2,155],138:[2,155],139:[2,155]},{7:184,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,149],6:[2,149],25:[2,149],26:[2,149],49:[2,149],54:[2,149],57:[2,149],73:[2,149],78:[2,149],86:[2,149],91:[2,149],93:[2,149],102:[2,149],104:[2,149],105:[2,149],106:[2,149],110:[2,149],118:[2,149],126:[2,149],129:[2,149],130:[2,149],133:[2,149],134:[2,149],135:[2,149],136:[2,149],137:[2,149],138:[2,149],139:[2,149]},{1:[2,154],6:[2,154],25:[2,154],26:[2,154],49:[2,154],54:[2,154],57:[2,154],73:[2,154],78:[2,154],86:[2,154],91:[2,154],93:[2,154],102:[2,154],104:[2,154],105:[2,154],106:[2,154],110:[2,154],118:[2,154],126:[2,154],129:[2,154],130:[2,154],133:[2,154],134:[2,154],135:[2,154],136:[2,154],137:[2,154],138:[2,154],139:[2,154]},{82:185,85:[1,103]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],40:[2,69],49:[2,69],54:[2,69],57:[2,69],66:[2,69],67:[2,69],68:[2,69],69:[2,69],71:[2,69],73:[2,69],74:[2,69],78:[2,69],80:[2,69],84:[2,69],85:[2,69],86:[2,69],91:[2,69],93:[2,69],102:[2,69],104:[2,69],105:[2,69],106:[2,69],110:[2,69],118:[2,69],126:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69],135:[2,69],136:[2,69],137:[2,69],138:[2,69],139:[2,69],140:[2,69]},{85:[2,109]},{27:186,28:[1,72]},{27:187,28:[1,72]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],27:188,28:[1,72],40:[2,84],49:[2,84],54:[2,84],57:[2,84],66:[2,84],67:[2,84],68:[2,84],69:[2,84],71:[2,84],73:[2,84],74:[2,84],78:[2,84],80:[2,84],84:[2,84],85:[2,84],86:[2,84],91:[2,84],93:[2,84],102:[2,84],104:[2,84],105:[2,84],106:[2,84],110:[2,84],118:[2,84],126:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84],135:[2,84],136:[2,84],137:[2,84],138:[2,84],139:[2,84],140:[2,84]},{27:189,28:[1,72]},{1:[2,85],6:[2,85],25:[2,85],26:[2,85],40:[2,85],49:[2,85],54:[2,85],57:[2,85],66:[2,85],67:[2,85],68:[2,85],69:[2,85],71:[2,85],73:[2,85],74:[2,85],78:[2,85],80:[2,85],84:[2,85],85:[2,85],86:[2,85],91:[2,85],93:[2,85],102:[2,85],104:[2,85],105:[2,85],106:[2,85],110:[2,85],118:[2,85],126:[2,85],129:[2,85],130:[2,85],131:[2,85],132:[2,85],133:[2,85],134:[2,85],135:[2,85],136:[2,85],137:[2,85],138:[2,85],139:[2,85],140:[2,85]},{7:191,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,195],58:46,59:47,61:35,63:23,64:24,65:25,72:190,75:192,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],92:193,93:[1,194],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{70:196,71:[1,97],74:[1,98]},{82:197,85:[1,103]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],40:[2,70],49:[2,70],54:[2,70],57:[2,70],66:[2,70],67:[2,70],68:[2,70],69:[2,70],71:[2,70],73:[2,70],74:[2,70],78:[2,70],80:[2,70],84:[2,70],85:[2,70],86:[2,70],91:[2,70],93:[2,70],102:[2,70],104:[2,70],105:[2,70],106:[2,70],110:[2,70],118:[2,70],126:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70],135:[2,70],136:[2,70],137:[2,70],138:[2,70],139:[2,70],140:[2,70]},{6:[1,199],7:198,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,200],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],49:[2,107],54:[2,107],57:[2,107],66:[2,107],67:[2,107],68:[2,107],69:[2,107],71:[2,107],73:[2,107],74:[2,107],78:[2,107],84:[2,107],85:[2,107],86:[2,107],91:[2,107],93:[2,107],102:[2,107],104:[2,107],105:[2,107],106:[2,107],110:[2,107],118:[2,107],126:[2,107],129:[2,107],130:[2,107],133:[2,107],134:[2,107],135:[2,107],136:[2,107],137:[2,107],138:[2,107],139:[2,107]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],86:[1,201],87:202,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],49:[1,204],53:206,54:[1,205]},{6:[2,55],25:[2,55],26:[2,55],49:[2,55],54:[2,55]},{6:[2,59],25:[2,59],26:[2,59],40:[1,208],49:[2,59],54:[2,59],57:[1,207]},{6:[2,62],25:[2,62],26:[2,62],49:[2,62],54:[2,62]},{6:[2,63],25:[2,63],26:[2,63],40:[2,63],49:[2,63],54:[2,63],57:[2,63]},{6:[2,64],25:[2,64],26:[2,64],40:[2,64],49:[2,64],54:[2,64],57:[2,64]},{6:[2,65],25:[2,65],26:[2,65],40:[2,65],49:[2,65],54:[2,65],57:[2,65]},{6:[2,66],25:[2,66],26:[2,66],40:[2,66],49:[2,66],54:[2,66],57:[2,66]},{27:150,28:[1,72]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:145,88:[1,57],89:[1,58],90:[1,56],91:[1,144],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,49],6:[2,49],25:[2,49],26:[2,49],49:[2,49],54:[2,49],57:[2,49],73:[2,49],78:[2,49],86:[2,49],91:[2,49],93:[2,49],102:[2,49],104:[2,49],105:[2,49],106:[2,49],110:[2,49],118:[2,49],126:[2,49],129:[2,49],130:[2,49],133:[2,49],134:[2,49],135:[2,49],136:[2,49],137:[2,49],138:[2,49],139:[2,49]},{4:210,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[1,209],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],49:[2,188],54:[2,188],57:[2,188],73:[2,188],78:[2,188],86:[2,188],91:[2,188],93:[2,188],102:[2,188],103:84,104:[2,188],105:[2,188],106:[2,188],109:85,110:[2,188],111:68,118:[2,188],126:[2,188],129:[2,188],130:[2,188],133:[1,74],134:[2,188],135:[2,188],136:[2,188],137:[2,188],138:[2,188],139:[2,188]},{103:87,104:[1,64],106:[1,65],109:88,110:[1,67],111:68,126:[1,86]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],49:[2,189],54:[2,189],57:[2,189],73:[2,189],78:[2,189],86:[2,189],91:[2,189],93:[2,189],102:[2,189],103:84,104:[2,189],105:[2,189],106:[2,189],109:85,110:[2,189],111:68,118:[2,189],126:[2,189],129:[2,189],130:[2,189],133:[1,74],134:[2,189],135:[1,78],136:[2,189],137:[2,189],138:[2,189],139:[2,189]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],49:[2,190],54:[2,190],57:[2,190],73:[2,190],78:[2,190],86:[2,190],91:[2,190],93:[2,190],102:[2,190],103:84,104:[2,190],105:[2,190],106:[2,190],109:85,110:[2,190],111:68,118:[2,190],126:[2,190],129:[2,190],130:[2,190],133:[1,74],134:[2,190],135:[1,78],136:[2,190],137:[2,190],138:[2,190],139:[2,190]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],49:[2,191],54:[2,191],57:[2,191],73:[2,191],78:[2,191],86:[2,191],91:[2,191],93:[2,191],102:[2,191],103:84,104:[2,191],105:[2,191],106:[2,191],109:85,110:[2,191],111:68,118:[2,191],126:[2,191],129:[2,191],130:[2,191],133:[1,74],134:[2,191],135:[1,78],136:[2,191],137:[2,191],138:[2,191],139:[2,191]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],49:[2,192],54:[2,192],57:[2,192],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,192],74:[2,72],78:[2,192],84:[2,72],85:[2,72],86:[2,192],91:[2,192],93:[2,192],102:[2,192],104:[2,192],105:[2,192],106:[2,192],110:[2,192],118:[2,192],126:[2,192],129:[2,192],130:[2,192],133:[2,192],134:[2,192],135:[2,192],136:[2,192],137:[2,192],138:[2,192],139:[2,192]},{62:90,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],74:[1,98],81:89,84:[1,91],85:[2,108]},{62:100,66:[1,92],67:[1,93],68:[1,94],69:[1,95],70:96,71:[1,97],74:[1,98],81:99,84:[1,91],85:[2,108]},{66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],74:[2,75],84:[2,75],85:[2,75]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],49:[2,193],54:[2,193],57:[2,193],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,193],74:[2,72],78:[2,193],84:[2,72],85:[2,72],86:[2,193],91:[2,193],93:[2,193],102:[2,193],104:[2,193],105:[2,193],106:[2,193],110:[2,193],118:[2,193],126:[2,193],129:[2,193],130:[2,193],133:[2,193],134:[2,193],135:[2,193],136:[2,193],137:[2,193],138:[2,193],139:[2,193]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],49:[2,194],54:[2,194],57:[2,194],73:[2,194],78:[2,194],86:[2,194],91:[2,194],93:[2,194],102:[2,194],104:[2,194],105:[2,194],106:[2,194],110:[2,194],118:[2,194],126:[2,194],129:[2,194],130:[2,194],133:[2,194],134:[2,194],135:[2,194],136:[2,194],137:[2,194],138:[2,194],139:[2,194]},{1:[2,195],6:[2,195],25:[2,195],26:[2,195],49:[2,195],54:[2,195],57:[2,195],73:[2,195],78:[2,195],86:[2,195],91:[2,195],93:[2,195],102:[2,195],104:[2,195],105:[2,195],106:[2,195],110:[2,195],118:[2,195],126:[2,195],129:[2,195],130:[2,195],133:[2,195],134:[2,195],135:[2,195],136:[2,195],137:[2,195],138:[2,195],139:[2,195]},{6:[1,213],7:211,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,212],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:214,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{24:215,25:[1,115],125:[1,216]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],49:[2,134],54:[2,134],57:[2,134],73:[2,134],78:[2,134],86:[2,134],91:[2,134],93:[2,134],97:217,98:[1,218],99:[1,219],102:[2,134],104:[2,134],105:[2,134],106:[2,134],110:[2,134],118:[2,134],126:[2,134],129:[2,134],130:[2,134],133:[2,134],134:[2,134],135:[2,134],136:[2,134],137:[2,134],138:[2,134],139:[2,134]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],49:[2,148],54:[2,148],57:[2,148],73:[2,148],78:[2,148],86:[2,148],91:[2,148],93:[2,148],102:[2,148],104:[2,148],105:[2,148],106:[2,148],110:[2,148],118:[2,148],126:[2,148],129:[2,148],130:[2,148],133:[2,148],134:[2,148],135:[2,148],136:[2,148],137:[2,148],138:[2,148],139:[2,148]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],49:[2,156],54:[2,156],57:[2,156],73:[2,156],78:[2,156],86:[2,156],91:[2,156],93:[2,156],102:[2,156],104:[2,156],105:[2,156],106:[2,156],110:[2,156],118:[2,156],126:[2,156],129:[2,156],130:[2,156],133:[2,156],134:[2,156],135:[2,156],136:[2,156],137:[2,156],138:[2,156],139:[2,156]},{25:[1,220],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{120:221,122:222,123:[1,223]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],49:[2,97],54:[2,97],57:[2,97],73:[2,97],78:[2,97],86:[2,97],91:[2,97],93:[2,97],102:[2,97],104:[2,97],105:[2,97],106:[2,97],110:[2,97],118:[2,97],126:[2,97],129:[2,97],130:[2,97],133:[2,97],134:[2,97],135:[2,97],136:[2,97],137:[2,97],138:[2,97],139:[2,97]},{7:224,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,100],6:[2,100],24:225,25:[1,115],26:[2,100],49:[2,100],54:[2,100],57:[2,100],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,100],74:[2,72],78:[2,100],80:[1,226],84:[2,72],85:[2,72],86:[2,100],91:[2,100],93:[2,100],102:[2,100],104:[2,100],105:[2,100],106:[2,100],110:[2,100],118:[2,100],126:[2,100],129:[2,100],130:[2,100],133:[2,100],134:[2,100],135:[2,100],136:[2,100],137:[2,100],138:[2,100],139:[2,100]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],49:[2,141],54:[2,141],57:[2,141],73:[2,141],78:[2,141],86:[2,141],91:[2,141],93:[2,141],102:[2,141],103:84,104:[2,141],105:[2,141],106:[2,141],109:85,110:[2,141],111:68,118:[2,141],126:[2,141],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,45],6:[2,45],26:[2,45],102:[2,45],103:84,104:[2,45],106:[2,45],109:85,110:[2,45],111:68,126:[2,45],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,73],102:[1,227]},{4:228,5:3,7:4,8:5,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,129],25:[2,129],54:[2,129],57:[1,230],91:[2,129],92:229,93:[1,194],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],40:[2,115],49:[2,115],54:[2,115],57:[2,115],66:[2,115],67:[2,115],68:[2,115],69:[2,115],71:[2,115],73:[2,115],74:[2,115],78:[2,115],84:[2,115],85:[2,115],86:[2,115],91:[2,115],93:[2,115],102:[2,115],104:[2,115],105:[2,115],106:[2,115],110:[2,115],116:[2,115],117:[2,115],118:[2,115],126:[2,115],129:[2,115],130:[2,115],133:[2,115],134:[2,115],135:[2,115],136:[2,115],137:[2,115],138:[2,115],139:[2,115]},{6:[2,52],25:[2,52],53:231,54:[1,232],91:[2,52]},{6:[2,124],25:[2,124],26:[2,124],54:[2,124],86:[2,124],91:[2,124]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:233,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,130],25:[2,130],26:[2,130],54:[2,130],86:[2,130],91:[2,130]},{6:[2,131],25:[2,131],26:[2,131],54:[2,131],86:[2,131],91:[2,131]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],40:[2,114],43:[2,114],49:[2,114],54:[2,114],57:[2,114],66:[2,114],67:[2,114],68:[2,114],69:[2,114],71:[2,114],73:[2,114],74:[2,114],78:[2,114],80:[2,114],84:[2,114],85:[2,114],86:[2,114],91:[2,114],93:[2,114],102:[2,114],104:[2,114],105:[2,114],106:[2,114],110:[2,114],116:[2,114],117:[2,114],118:[2,114],126:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114],135:[2,114],136:[2,114],137:[2,114],138:[2,114],139:[2,114],140:[2,114]},{24:234,25:[1,115],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],49:[2,144],54:[2,144],57:[2,144],73:[2,144],78:[2,144],86:[2,144],91:[2,144],93:[2,144],102:[2,144],103:84,104:[1,64],105:[1,235],106:[1,65],109:85,110:[1,67],111:68,118:[2,144],126:[2,144],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],49:[2,146],54:[2,146],57:[2,146],73:[2,146],78:[2,146],86:[2,146],91:[2,146],93:[2,146],102:[2,146],103:84,104:[1,64],105:[1,236],106:[1,65],109:85,110:[1,67],111:68,118:[2,146],126:[2,146],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,152],6:[2,152],25:[2,152],26:[2,152],49:[2,152],54:[2,152],57:[2,152],73:[2,152],78:[2,152],86:[2,152],91:[2,152],93:[2,152],102:[2,152],104:[2,152],105:[2,152],106:[2,152],110:[2,152],118:[2,152],126:[2,152],129:[2,152],130:[2,152],133:[2,152],134:[2,152],135:[2,152],136:[2,152],137:[2,152],138:[2,152],139:[2,152]},{1:[2,153],6:[2,153],25:[2,153],26:[2,153],49:[2,153],54:[2,153],57:[2,153],73:[2,153],78:[2,153],86:[2,153],91:[2,153],93:[2,153],102:[2,153],103:84,104:[1,64],105:[2,153],106:[1,65],109:85,110:[1,67],111:68,118:[2,153],126:[2,153],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],49:[2,157],54:[2,157],57:[2,157],73:[2,157],78:[2,157],86:[2,157],91:[2,157],93:[2,157],102:[2,157],104:[2,157],105:[2,157],106:[2,157],110:[2,157],118:[2,157],126:[2,157],129:[2,157],130:[2,157],133:[2,157],134:[2,157],135:[2,157],136:[2,157],137:[2,157],138:[2,157],139:[2,157]},{116:[2,159],117:[2,159]},{27:160,28:[1,72],44:161,58:162,59:163,76:[1,69],89:[1,112],90:[1,113],113:237,115:159},{54:[1,238],116:[2,165],117:[2,165]},{54:[2,161],116:[2,161],117:[2,161]},{54:[2,162],116:[2,162],117:[2,162]},{54:[2,163],116:[2,163],117:[2,163]},{54:[2,164],116:[2,164],117:[2,164]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],49:[2,158],54:[2,158],57:[2,158],73:[2,158],78:[2,158],86:[2,158],91:[2,158],93:[2,158],102:[2,158],104:[2,158],105:[2,158],106:[2,158],110:[2,158],118:[2,158],126:[2,158],129:[2,158],130:[2,158],133:[2,158],134:[2,158],135:[2,158],136:[2,158],137:[2,158],138:[2,158],139:[2,158]},{7:239,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:240,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],53:241,54:[1,242],78:[2,52]},{6:[2,92],25:[2,92],26:[2,92],54:[2,92],78:[2,92]},{6:[2,38],25:[2,38],26:[2,38],43:[1,243],54:[2,38],78:[2,38]},{6:[2,41],25:[2,41],26:[2,41],54:[2,41],78:[2,41]},{6:[2,42],25:[2,42],26:[2,42],43:[2,42],54:[2,42],78:[2,42]},{6:[2,43],25:[2,43],26:[2,43],43:[2,43],54:[2,43],78:[2,43]},{6:[2,44],25:[2,44],26:[2,44],43:[2,44],54:[2,44],78:[2,44]},{1:[2,4],6:[2,4],26:[2,4],102:[2,4]},{1:[2,197],6:[2,197],25:[2,197],26:[2,197],49:[2,197],54:[2,197],57:[2,197],73:[2,197],78:[2,197],86:[2,197],91:[2,197],93:[2,197],102:[2,197],103:84,104:[2,197],105:[2,197],106:[2,197],109:85,110:[2,197],111:68,118:[2,197],126:[2,197],129:[2,197],130:[2,197],133:[1,74],134:[1,77],135:[1,78],136:[2,197],137:[2,197],138:[2,197],139:[2,197]},{1:[2,198],6:[2,198],25:[2,198],26:[2,198],49:[2,198],54:[2,198],57:[2,198],73:[2,198],78:[2,198],86:[2,198],91:[2,198],93:[2,198],102:[2,198],103:84,104:[2,198],105:[2,198],106:[2,198],109:85,110:[2,198],111:68,118:[2,198],126:[2,198],129:[2,198],130:[2,198],133:[1,74],134:[1,77],135:[1,78],136:[2,198],137:[2,198],138:[2,198],139:[2,198]},{1:[2,199],6:[2,199],25:[2,199],26:[2,199],49:[2,199],54:[2,199],57:[2,199],73:[2,199],78:[2,199],86:[2,199],91:[2,199],93:[2,199],102:[2,199],103:84,104:[2,199],105:[2,199],106:[2,199],109:85,110:[2,199],111:68,118:[2,199],126:[2,199],129:[2,199],130:[2,199],133:[1,74],134:[2,199],135:[1,78],136:[2,199],137:[2,199],138:[2,199],139:[2,199]},{1:[2,200],6:[2,200],25:[2,200],26:[2,200],49:[2,200],54:[2,200],57:[2,200],73:[2,200],78:[2,200],86:[2,200],91:[2,200],93:[2,200],102:[2,200],103:84,104:[2,200],105:[2,200],106:[2,200],109:85,110:[2,200],111:68,118:[2,200],126:[2,200],129:[2,200],130:[2,200],133:[1,74],134:[2,200],135:[1,78],136:[2,200],137:[2,200],138:[2,200],139:[2,200]},{1:[2,201],6:[2,201],25:[2,201],26:[2,201],49:[2,201],54:[2,201],57:[2,201],73:[2,201],78:[2,201],86:[2,201],91:[2,201],93:[2,201],102:[2,201],103:84,104:[2,201],105:[2,201],106:[2,201],109:85,110:[2,201],111:68,118:[2,201],126:[2,201],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[2,201],137:[2,201],138:[2,201],139:[2,201]},{1:[2,202],6:[2,202],25:[2,202],26:[2,202],49:[2,202],54:[2,202],57:[2,202],73:[2,202],78:[2,202],86:[2,202],91:[2,202],93:[2,202],102:[2,202],103:84,104:[2,202],105:[2,202],106:[2,202],109:85,110:[2,202],111:68,118:[2,202],126:[2,202],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[2,202],138:[2,202],139:[1,82]},{1:[2,203],6:[2,203],25:[2,203],26:[2,203],49:[2,203],54:[2,203],57:[2,203],73:[2,203],78:[2,203],86:[2,203],91:[2,203],93:[2,203],102:[2,203],103:84,104:[2,203],105:[2,203],106:[2,203],109:85,110:[2,203],111:68,118:[2,203],126:[2,203],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[2,203],139:[1,82]},{1:[2,204],6:[2,204],25:[2,204],26:[2,204],49:[2,204],54:[2,204],57:[2,204],73:[2,204],78:[2,204],86:[2,204],91:[2,204],93:[2,204],102:[2,204],103:84,104:[2,204],105:[2,204],106:[2,204],109:85,110:[2,204],111:68,118:[2,204],126:[2,204],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[2,204],138:[2,204],139:[2,204]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],49:[2,187],54:[2,187],57:[2,187],73:[2,187],78:[2,187],86:[2,187],91:[2,187],93:[2,187],102:[2,187],103:84,104:[1,64],105:[2,187],106:[1,65],109:85,110:[1,67],111:68,118:[2,187],126:[2,187],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],49:[2,186],54:[2,186],57:[2,186],73:[2,186],78:[2,186],86:[2,186],91:[2,186],93:[2,186],102:[2,186],103:84,104:[1,64],105:[2,186],106:[1,65],109:85,110:[1,67],111:68,118:[2,186],126:[2,186],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],49:[2,104],54:[2,104],57:[2,104],66:[2,104],67:[2,104],68:[2,104],69:[2,104],71:[2,104],73:[2,104],74:[2,104],78:[2,104],84:[2,104],85:[2,104],86:[2,104],91:[2,104],93:[2,104],102:[2,104],104:[2,104],105:[2,104],106:[2,104],110:[2,104],118:[2,104],126:[2,104],129:[2,104],130:[2,104],133:[2,104],134:[2,104],135:[2,104],136:[2,104],137:[2,104],138:[2,104],139:[2,104]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],40:[2,80],49:[2,80],54:[2,80],57:[2,80],66:[2,80],67:[2,80],68:[2,80],69:[2,80],71:[2,80],73:[2,80],74:[2,80],78:[2,80],80:[2,80],84:[2,80],85:[2,80],86:[2,80],91:[2,80],93:[2,80],102:[2,80],104:[2,80],105:[2,80],106:[2,80],110:[2,80],118:[2,80],126:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80],136:[2,80],137:[2,80],138:[2,80],139:[2,80],140:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],40:[2,81],49:[2,81],54:[2,81],57:[2,81],66:[2,81],67:[2,81],68:[2,81],69:[2,81],71:[2,81],73:[2,81],74:[2,81],78:[2,81],80:[2,81],84:[2,81],85:[2,81],86:[2,81],91:[2,81],93:[2,81],102:[2,81],104:[2,81],105:[2,81],106:[2,81],110:[2,81],118:[2,81],126:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81],136:[2,81],137:[2,81],138:[2,81],139:[2,81],140:[2,81]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],40:[2,82],49:[2,82],54:[2,82],57:[2,82],66:[2,82],67:[2,82],68:[2,82],69:[2,82],71:[2,82],73:[2,82],74:[2,82],78:[2,82],80:[2,82],84:[2,82],85:[2,82],86:[2,82],91:[2,82],93:[2,82],102:[2,82],104:[2,82],105:[2,82],106:[2,82],110:[2,82],118:[2,82],126:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82],135:[2,82],136:[2,82],137:[2,82],138:[2,82],139:[2,82],140:[2,82]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],40:[2,83],49:[2,83],54:[2,83],57:[2,83],66:[2,83],67:[2,83],68:[2,83],69:[2,83],71:[2,83],73:[2,83],74:[2,83],78:[2,83],80:[2,83],84:[2,83],85:[2,83],86:[2,83],91:[2,83],93:[2,83],102:[2,83],104:[2,83],105:[2,83],106:[2,83],110:[2,83],118:[2,83],126:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83],134:[2,83],135:[2,83],136:[2,83],137:[2,83],138:[2,83],139:[2,83],140:[2,83]},{73:[1,244]},{57:[1,195],73:[2,88],92:245,93:[1,194],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{73:[2,89]},{7:246,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,73:[2,123],76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{11:[2,117],28:[2,117],30:[2,117],31:[2,117],33:[2,117],34:[2,117],35:[2,117],36:[2,117],37:[2,117],38:[2,117],45:[2,117],46:[2,117],47:[2,117],51:[2,117],52:[2,117],73:[2,117],76:[2,117],79:[2,117],83:[2,117],88:[2,117],89:[2,117],90:[2,117],96:[2,117],100:[2,117],101:[2,117],104:[2,117],106:[2,117],108:[2,117],110:[2,117],119:[2,117],125:[2,117],127:[2,117],128:[2,117],129:[2,117],130:[2,117],131:[2,117],132:[2,117]},{11:[2,118],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],73:[2,118],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118],132:[2,118]},{1:[2,87],6:[2,87],25:[2,87],26:[2,87],40:[2,87],49:[2,87],54:[2,87],57:[2,87],66:[2,87],67:[2,87],68:[2,87],69:[2,87],71:[2,87],73:[2,87],74:[2,87],78:[2,87],80:[2,87],84:[2,87],85:[2,87],86:[2,87],91:[2,87],93:[2,87],102:[2,87],104:[2,87],105:[2,87],106:[2,87],110:[2,87],118:[2,87],126:[2,87],129:[2,87],130:[2,87],131:[2,87],132:[2,87],133:[2,87],134:[2,87],135:[2,87],136:[2,87],137:[2,87],138:[2,87],139:[2,87],140:[2,87]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],49:[2,105],54:[2,105],57:[2,105],66:[2,105],67:[2,105],68:[2,105],69:[2,105],71:[2,105],73:[2,105],74:[2,105],78:[2,105],84:[2,105],85:[2,105],86:[2,105],91:[2,105],93:[2,105],102:[2,105],104:[2,105],105:[2,105],106:[2,105],110:[2,105],118:[2,105],126:[2,105],129:[2,105],130:[2,105],133:[2,105],134:[2,105],135:[2,105],136:[2,105],137:[2,105],138:[2,105],139:[2,105]},{1:[2,35],6:[2,35],25:[2,35],26:[2,35],49:[2,35],54:[2,35],57:[2,35],73:[2,35],78:[2,35],86:[2,35],91:[2,35],93:[2,35],102:[2,35],103:84,104:[2,35],105:[2,35],106:[2,35],109:85,110:[2,35],111:68,118:[2,35],126:[2,35],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:247,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:248,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],49:[2,110],54:[2,110],57:[2,110],66:[2,110],67:[2,110],68:[2,110],69:[2,110],71:[2,110],73:[2,110],74:[2,110],78:[2,110],84:[2,110],85:[2,110],86:[2,110],91:[2,110],93:[2,110],102:[2,110],104:[2,110],105:[2,110],106:[2,110],110:[2,110],118:[2,110],126:[2,110],129:[2,110],130:[2,110],133:[2,110],134:[2,110],135:[2,110],136:[2,110],137:[2,110],138:[2,110],139:[2,110]},{6:[2,52],25:[2,52],53:249,54:[1,232],86:[2,52]},{6:[2,129],25:[2,129],26:[2,129],54:[2,129],57:[1,250],86:[2,129],91:[2,129],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{50:251,51:[1,59],52:[1,60]},{6:[2,53],25:[2,53],26:[2,53],27:108,28:[1,72],44:109,55:252,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[1,253],25:[1,254]},{6:[2,60],25:[2,60],26:[2,60],49:[2,60],54:[2,60]},{7:255,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],49:[2,23],54:[2,23],57:[2,23],73:[2,23],78:[2,23],86:[2,23],91:[2,23],93:[2,23],98:[2,23],99:[2,23],102:[2,23],104:[2,23],105:[2,23],106:[2,23],110:[2,23],118:[2,23],121:[2,23],123:[2,23],126:[2,23],129:[2,23],130:[2,23],133:[2,23],134:[2,23],135:[2,23],136:[2,23],137:[2,23],138:[2,23],139:[2,23]},{6:[1,73],26:[1,256]},{1:[2,205],6:[2,205],25:[2,205],26:[2,205],49:[2,205],54:[2,205],57:[2,205],73:[2,205],78:[2,205],86:[2,205],91:[2,205],93:[2,205],102:[2,205],103:84,104:[2,205],105:[2,205],106:[2,205],109:85,110:[2,205],111:68,118:[2,205],126:[2,205],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:257,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:258,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,208],6:[2,208],25:[2,208],26:[2,208],49:[2,208],54:[2,208],57:[2,208],73:[2,208],78:[2,208],86:[2,208],91:[2,208],93:[2,208],102:[2,208],103:84,104:[2,208],105:[2,208],106:[2,208],109:85,110:[2,208],111:68,118:[2,208],126:[2,208],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],49:[2,185],54:[2,185],57:[2,185],73:[2,185],78:[2,185],86:[2,185],91:[2,185],93:[2,185],102:[2,185],104:[2,185],105:[2,185],106:[2,185],110:[2,185],118:[2,185],126:[2,185],129:[2,185],130:[2,185],133:[2,185],134:[2,185],135:[2,185],136:[2,185],137:[2,185],138:[2,185],139:[2,185]},{7:259,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],49:[2,135],54:[2,135],57:[2,135],73:[2,135],78:[2,135],86:[2,135],91:[2,135],93:[2,135],98:[1,260],102:[2,135],104:[2,135],105:[2,135],106:[2,135],110:[2,135],118:[2,135],126:[2,135],129:[2,135],130:[2,135],133:[2,135],134:[2,135],135:[2,135],136:[2,135],137:[2,135],138:[2,135],139:[2,135]},{24:261,25:[1,115]},{24:264,25:[1,115],27:262,28:[1,72],59:263,76:[1,69]},{120:265,122:222,123:[1,223]},{26:[1,266],121:[1,267],122:268,123:[1,223]},{26:[2,178],121:[2,178],123:[2,178]},{7:270,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],95:269,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,98],6:[2,98],24:271,25:[1,115],26:[2,98],49:[2,98],54:[2,98],57:[2,98],73:[2,98],78:[2,98],86:[2,98],91:[2,98],93:[2,98],102:[2,98],103:84,104:[1,64],105:[2,98],106:[1,65],109:85,110:[1,67],111:68,118:[2,98],126:[2,98],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,101],6:[2,101],25:[2,101],26:[2,101],49:[2,101],54:[2,101],57:[2,101],73:[2,101],78:[2,101],86:[2,101],91:[2,101],93:[2,101],102:[2,101],104:[2,101],105:[2,101],106:[2,101],110:[2,101],118:[2,101],126:[2,101],129:[2,101],130:[2,101],133:[2,101],134:[2,101],135:[2,101],136:[2,101],137:[2,101],138:[2,101],139:[2,101]},{7:272,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],49:[2,142],54:[2,142],57:[2,142],66:[2,142],67:[2,142],68:[2,142],69:[2,142],71:[2,142],73:[2,142],74:[2,142],78:[2,142],84:[2,142],85:[2,142],86:[2,142],91:[2,142],93:[2,142],102:[2,142],104:[2,142],105:[2,142],106:[2,142],110:[2,142],118:[2,142],126:[2,142],129:[2,142],130:[2,142],133:[2,142],134:[2,142],135:[2,142],136:[2,142],137:[2,142],138:[2,142],139:[2,142]},{6:[1,73],26:[1,273]},{7:274,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,67],11:[2,118],25:[2,67],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],54:[2,67],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],91:[2,67],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118],132:[2,118]},{6:[1,276],25:[1,277],91:[1,275]},{6:[2,53],7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[2,53],26:[2,53],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],86:[2,53],88:[1,57],89:[1,58],90:[1,56],91:[2,53],94:278,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,52],25:[2,52],26:[2,52],53:279,54:[1,232]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],49:[2,182],54:[2,182],57:[2,182],73:[2,182],78:[2,182],86:[2,182],91:[2,182],93:[2,182],102:[2,182],104:[2,182],105:[2,182],106:[2,182],110:[2,182],118:[2,182],121:[2,182],126:[2,182],129:[2,182],130:[2,182],133:[2,182],134:[2,182],135:[2,182],136:[2,182],137:[2,182],138:[2,182],139:[2,182]},{7:280,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:281,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{116:[2,160],117:[2,160]},{27:160,28:[1,72],44:161,58:162,59:163,76:[1,69],89:[1,112],90:[1,113],115:282},{1:[2,167],6:[2,167],25:[2,167],26:[2,167],49:[2,167],54:[2,167],57:[2,167],73:[2,167],78:[2,167],86:[2,167],91:[2,167],93:[2,167],102:[2,167],103:84,104:[2,167],105:[1,283],106:[2,167],109:85,110:[2,167],111:68,118:[1,284],126:[2,167],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,168],6:[2,168],25:[2,168],26:[2,168],49:[2,168],54:[2,168],57:[2,168],73:[2,168],78:[2,168],86:[2,168],91:[2,168],93:[2,168],102:[2,168],103:84,104:[2,168],105:[1,285],106:[2,168],109:85,110:[2,168],111:68,118:[2,168],126:[2,168],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,287],25:[1,288],78:[1,286]},{6:[2,53],10:170,25:[2,53],26:[2,53],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:289,42:169,44:173,46:[1,45],78:[2,53],89:[1,112]},{7:290,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,291],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,86],6:[2,86],25:[2,86],26:[2,86],40:[2,86],49:[2,86],54:[2,86],57:[2,86],66:[2,86],67:[2,86],68:[2,86],69:[2,86],71:[2,86],73:[2,86],74:[2,86],78:[2,86],80:[2,86],84:[2,86],85:[2,86],86:[2,86],91:[2,86],93:[2,86],102:[2,86],104:[2,86],105:[2,86],106:[2,86],110:[2,86],118:[2,86],126:[2,86],129:[2,86],130:[2,86],131:[2,86],132:[2,86],133:[2,86],134:[2,86],135:[2,86],136:[2,86],137:[2,86],138:[2,86],139:[2,86],140:[2,86]},{7:292,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,73:[2,121],76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{73:[2,122],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,36],6:[2,36],25:[2,36],26:[2,36],49:[2,36],54:[2,36],57:[2,36],73:[2,36],78:[2,36],86:[2,36],91:[2,36],93:[2,36],102:[2,36],103:84,104:[2,36],105:[2,36],106:[2,36],109:85,110:[2,36],111:68,118:[2,36],126:[2,36],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{26:[1,293],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,276],25:[1,277],86:[1,294]},{6:[2,67],25:[2,67],26:[2,67],54:[2,67],86:[2,67],91:[2,67]},{24:295,25:[1,115]},{6:[2,56],25:[2,56],26:[2,56],49:[2,56],54:[2,56]},{27:108,28:[1,72],44:109,55:296,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[2,54],25:[2,54],26:[2,54],27:108,28:[1,72],44:109,48:297,54:[2,54],55:105,56:106,57:[1,107],58:110,59:111,76:[1,69],89:[1,112],90:[1,113]},{6:[2,61],25:[2,61],26:[2,61],49:[2,61],54:[2,61],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],49:[2,24],54:[2,24],57:[2,24],73:[2,24],78:[2,24],86:[2,24],91:[2,24],93:[2,24],98:[2,24],99:[2,24],102:[2,24],104:[2,24],105:[2,24],106:[2,24],110:[2,24],118:[2,24],121:[2,24],123:[2,24],126:[2,24],129:[2,24],130:[2,24],133:[2,24],134:[2,24],135:[2,24],136:[2,24],137:[2,24],138:[2,24],139:[2,24]},{26:[1,298],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,207],6:[2,207],25:[2,207],26:[2,207],49:[2,207],54:[2,207],57:[2,207],73:[2,207],78:[2,207],86:[2,207],91:[2,207],93:[2,207],102:[2,207],103:84,104:[2,207],105:[2,207],106:[2,207],109:85,110:[2,207],111:68,118:[2,207],126:[2,207],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{24:299,25:[1,115],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{24:300,25:[1,115]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],49:[2,136],54:[2,136],57:[2,136],73:[2,136],78:[2,136],86:[2,136],91:[2,136],93:[2,136],102:[2,136],104:[2,136],105:[2,136],106:[2,136],110:[2,136],118:[2,136],126:[2,136],129:[2,136],130:[2,136],133:[2,136],134:[2,136],135:[2,136],136:[2,136],137:[2,136],138:[2,136],139:[2,136]},{24:301,25:[1,115]},{24:302,25:[1,115]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],49:[2,140],54:[2,140],57:[2,140],73:[2,140],78:[2,140],86:[2,140],91:[2,140],93:[2,140],98:[2,140],102:[2,140],104:[2,140],105:[2,140],106:[2,140],110:[2,140],118:[2,140],126:[2,140],129:[2,140],130:[2,140],133:[2,140],134:[2,140],135:[2,140],136:[2,140],137:[2,140],138:[2,140],139:[2,140]},{26:[1,303],121:[1,304],122:268,123:[1,223]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],49:[2,176],54:[2,176],57:[2,176],73:[2,176],78:[2,176],86:[2,176],91:[2,176],93:[2,176],102:[2,176],104:[2,176],105:[2,176],106:[2,176],110:[2,176],118:[2,176],126:[2,176],129:[2,176],130:[2,176],133:[2,176],134:[2,176],135:[2,176],136:[2,176],137:[2,176],138:[2,176],139:[2,176]},{24:305,25:[1,115]},{26:[2,179],121:[2,179],123:[2,179]},{24:306,25:[1,115],54:[1,307]},{25:[2,132],54:[2,132],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],49:[2,99],54:[2,99],57:[2,99],73:[2,99],78:[2,99],86:[2,99],91:[2,99],93:[2,99],102:[2,99],104:[2,99],105:[2,99],106:[2,99],110:[2,99],118:[2,99],126:[2,99],129:[2,99],130:[2,99],133:[2,99],134:[2,99],135:[2,99],136:[2,99],137:[2,99],138:[2,99],139:[2,99]},{1:[2,102],6:[2,102],24:308,25:[1,115],26:[2,102],49:[2,102],54:[2,102],57:[2,102],73:[2,102],78:[2,102],86:[2,102],91:[2,102],93:[2,102],102:[2,102],103:84,104:[1,64],105:[2,102],106:[1,65],109:85,110:[1,67],111:68,118:[2,102],126:[2,102],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{102:[1,309]},{91:[1,310],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,116],6:[2,116],25:[2,116],26:[2,116],40:[2,116],49:[2,116],54:[2,116],57:[2,116],66:[2,116],67:[2,116],68:[2,116],69:[2,116],71:[2,116],73:[2,116],74:[2,116],78:[2,116],84:[2,116],85:[2,116],86:[2,116],91:[2,116],93:[2,116],102:[2,116],104:[2,116],105:[2,116],106:[2,116],110:[2,116],116:[2,116],117:[2,116],118:[2,116],126:[2,116],129:[2,116],130:[2,116],133:[2,116],134:[2,116],135:[2,116],136:[2,116],137:[2,116],138:[2,116],139:[2,116]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],94:311,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:203,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,147],27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],57:[1,149],58:46,59:47,60:148,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],87:312,88:[1,57],89:[1,58],90:[1,56],94:146,96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[2,125],25:[2,125],26:[2,125],54:[2,125],86:[2,125],91:[2,125]},{6:[1,276],25:[1,277],26:[1,313]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],49:[2,145],54:[2,145],57:[2,145],73:[2,145],78:[2,145],86:[2,145],91:[2,145],93:[2,145],102:[2,145],103:84,104:[1,64],105:[2,145],106:[1,65],109:85,110:[1,67],111:68,118:[2,145],126:[2,145],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],49:[2,147],54:[2,147],57:[2,147],73:[2,147],78:[2,147],86:[2,147],91:[2,147],93:[2,147],102:[2,147],103:84,104:[1,64],105:[2,147],106:[1,65],109:85,110:[1,67],111:68,118:[2,147],126:[2,147],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{116:[2,166],117:[2,166]},{7:314,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:315,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:316,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],40:[2,90],49:[2,90],54:[2,90],57:[2,90],66:[2,90],67:[2,90],68:[2,90],69:[2,90],71:[2,90],73:[2,90],74:[2,90],78:[2,90],84:[2,90],85:[2,90],86:[2,90],91:[2,90],93:[2,90],102:[2,90],104:[2,90],105:[2,90],106:[2,90],110:[2,90],116:[2,90],117:[2,90],118:[2,90],126:[2,90],129:[2,90],130:[2,90],133:[2,90],134:[2,90],135:[2,90],136:[2,90],137:[2,90],138:[2,90],139:[2,90]},{10:170,27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:317,42:169,44:173,46:[1,45],89:[1,112]},{6:[2,91],10:170,25:[2,91],26:[2,91],27:171,28:[1,72],29:172,30:[1,70],31:[1,71],41:168,42:169,44:173,46:[1,45],54:[2,91],77:318,89:[1,112]},{6:[2,93],25:[2,93],26:[2,93],54:[2,93],78:[2,93]},{6:[2,39],25:[2,39],26:[2,39],54:[2,39],78:[2,39],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{7:319,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{73:[2,120],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,37],6:[2,37],25:[2,37],26:[2,37],49:[2,37],54:[2,37],57:[2,37],73:[2,37],78:[2,37],86:[2,37],91:[2,37],93:[2,37],102:[2,37],104:[2,37],105:[2,37],106:[2,37],110:[2,37],118:[2,37],126:[2,37],129:[2,37],130:[2,37],133:[2,37],134:[2,37],135:[2,37],136:[2,37],137:[2,37],138:[2,37],139:[2,37]},{1:[2,111],6:[2,111],25:[2,111],26:[2,111],49:[2,111],54:[2,111],57:[2,111],66:[2,111],67:[2,111],68:[2,111],69:[2,111],71:[2,111],73:[2,111],74:[2,111],78:[2,111],84:[2,111],85:[2,111],86:[2,111],91:[2,111],93:[2,111],102:[2,111],104:[2,111],105:[2,111],106:[2,111],110:[2,111],118:[2,111],126:[2,111],129:[2,111],130:[2,111],133:[2,111],134:[2,111],135:[2,111],136:[2,111],137:[2,111],138:[2,111],139:[2,111]},{1:[2,48],6:[2,48],25:[2,48],26:[2,48],49:[2,48],54:[2,48],57:[2,48],73:[2,48],78:[2,48],86:[2,48],91:[2,48],93:[2,48],102:[2,48],104:[2,48],105:[2,48],106:[2,48],110:[2,48],118:[2,48],126:[2,48],129:[2,48],130:[2,48],133:[2,48],134:[2,48],135:[2,48],136:[2,48],137:[2,48],138:[2,48],139:[2,48]},{6:[2,57],25:[2,57],26:[2,57],49:[2,57],54:[2,57]},{6:[2,52],25:[2,52],26:[2,52],53:320,54:[1,205]},{1:[2,206],6:[2,206],25:[2,206],26:[2,206],49:[2,206],54:[2,206],57:[2,206],73:[2,206],78:[2,206],86:[2,206],91:[2,206],93:[2,206],102:[2,206],104:[2,206],105:[2,206],106:[2,206],110:[2,206],118:[2,206],126:[2,206],129:[2,206],130:[2,206],133:[2,206],134:[2,206],135:[2,206],136:[2,206],137:[2,206],138:[2,206],139:[2,206]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],49:[2,183],54:[2,183],57:[2,183],73:[2,183],78:[2,183],86:[2,183],91:[2,183],93:[2,183],102:[2,183],104:[2,183],105:[2,183],106:[2,183],110:[2,183],118:[2,183],121:[2,183],126:[2,183],129:[2,183],130:[2,183],133:[2,183],134:[2,183],135:[2,183],136:[2,183],137:[2,183],138:[2,183],139:[2,183]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],49:[2,137],54:[2,137],57:[2,137],73:[2,137],78:[2,137],86:[2,137],91:[2,137],93:[2,137],102:[2,137],104:[2,137],105:[2,137],106:[2,137],110:[2,137],118:[2,137],126:[2,137],129:[2,137],130:[2,137],133:[2,137],134:[2,137],135:[2,137],136:[2,137],137:[2,137],138:[2,137],139:[2,137]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],49:[2,138],54:[2,138],57:[2,138],73:[2,138],78:[2,138],86:[2,138],91:[2,138],93:[2,138],98:[2,138],102:[2,138],104:[2,138],105:[2,138],106:[2,138],110:[2,138],118:[2,138],126:[2,138],129:[2,138],130:[2,138],133:[2,138],134:[2,138],135:[2,138],136:[2,138],137:[2,138],138:[2,138],139:[2,138]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],49:[2,139],54:[2,139],57:[2,139],73:[2,139],78:[2,139],86:[2,139],91:[2,139],93:[2,139],98:[2,139],102:[2,139],104:[2,139],105:[2,139],106:[2,139],110:[2,139],118:[2,139],126:[2,139],129:[2,139],130:[2,139],133:[2,139],134:[2,139],135:[2,139],136:[2,139],137:[2,139],138:[2,139],139:[2,139]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],49:[2,174],54:[2,174],57:[2,174],73:[2,174],78:[2,174],86:[2,174],91:[2,174],93:[2,174],102:[2,174],104:[2,174],105:[2,174],106:[2,174],110:[2,174],118:[2,174],126:[2,174],129:[2,174],130:[2,174],133:[2,174],134:[2,174],135:[2,174],136:[2,174],137:[2,174],138:[2,174],139:[2,174]},{24:321,25:[1,115]},{26:[1,322]},{6:[1,323],26:[2,180],121:[2,180],123:[2,180]},{7:324,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],49:[2,103],54:[2,103],57:[2,103],73:[2,103],78:[2,103],86:[2,103],91:[2,103],93:[2,103],102:[2,103],104:[2,103],105:[2,103],106:[2,103],110:[2,103],118:[2,103],126:[2,103],129:[2,103],130:[2,103],133:[2,103],134:[2,103],135:[2,103],136:[2,103],137:[2,103],138:[2,103],139:[2,103]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],49:[2,143],54:[2,143],57:[2,143],66:[2,143],67:[2,143],68:[2,143],69:[2,143],71:[2,143],73:[2,143],74:[2,143],78:[2,143],84:[2,143],85:[2,143],86:[2,143],91:[2,143],93:[2,143],102:[2,143],104:[2,143],105:[2,143],106:[2,143],110:[2,143],118:[2,143],126:[2,143],129:[2,143],130:[2,143],133:[2,143],134:[2,143],135:[2,143],136:[2,143],137:[2,143],138:[2,143],139:[2,143]},{1:[2,119],6:[2,119],25:[2,119],26:[2,119],49:[2,119],54:[2,119],57:[2,119],66:[2,119],67:[2,119],68:[2,119],69:[2,119],71:[2,119],73:[2,119],74:[2,119],78:[2,119],84:[2,119],85:[2,119],86:[2,119],91:[2,119],93:[2,119],102:[2,119],104:[2,119],105:[2,119],106:[2,119],110:[2,119],118:[2,119],126:[2,119],129:[2,119],130:[2,119],133:[2,119],134:[2,119],135:[2,119],136:[2,119],137:[2,119],138:[2,119],139:[2,119]},{6:[2,126],25:[2,126],26:[2,126],54:[2,126],86:[2,126],91:[2,126]},{6:[2,52],25:[2,52],26:[2,52],53:325,54:[1,232]},{6:[2,127],25:[2,127],26:[2,127],54:[2,127],86:[2,127],91:[2,127]},{1:[2,169],6:[2,169],25:[2,169],26:[2,169],49:[2,169],54:[2,169],57:[2,169],73:[2,169],78:[2,169],86:[2,169],91:[2,169],93:[2,169],102:[2,169],103:84,104:[2,169],105:[2,169],106:[2,169],109:85,110:[2,169],111:68,118:[1,326],126:[2,169],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],49:[2,171],54:[2,171],57:[2,171],73:[2,171],78:[2,171],86:[2,171],91:[2,171],93:[2,171],102:[2,171],103:84,104:[2,171],105:[1,327],106:[2,171],109:85,110:[2,171],111:68,118:[2,171],126:[2,171],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],49:[2,170],54:[2,170],57:[2,170],73:[2,170],78:[2,170],86:[2,170],91:[2,170],93:[2,170],102:[2,170],103:84,104:[2,170],105:[2,170],106:[2,170],109:85,110:[2,170],111:68,118:[2,170],126:[2,170],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[2,94],25:[2,94],26:[2,94],54:[2,94],78:[2,94]},{6:[2,52],25:[2,52],26:[2,52],53:328,54:[1,242]},{26:[1,329],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,253],25:[1,254],26:[1,330]},{26:[1,331]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],49:[2,177],54:[2,177],57:[2,177],73:[2,177],78:[2,177],86:[2,177],91:[2,177],93:[2,177],102:[2,177],104:[2,177],105:[2,177],106:[2,177],110:[2,177],118:[2,177],126:[2,177],129:[2,177],130:[2,177],133:[2,177],134:[2,177],135:[2,177],136:[2,177],137:[2,177],138:[2,177],139:[2,177]},{26:[2,181],121:[2,181],123:[2,181]},{25:[2,133],54:[2,133],103:84,104:[1,64],106:[1,65],109:85,110:[1,67],111:68,126:[1,83],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[1,276],25:[1,277],26:[1,332]},{7:333,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{7:334,8:117,9:18,10:19,11:[1,20],12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:61,28:[1,72],29:48,30:[1,70],31:[1,71],32:22,33:[1,49],34:[1,50],35:[1,51],36:[1,52],37:[1,53],38:[1,54],39:21,44:62,45:[1,44],46:[1,45],47:[1,27],50:28,51:[1,59],52:[1,60],58:46,59:47,61:35,63:23,64:24,65:25,76:[1,69],79:[1,42],83:[1,26],88:[1,57],89:[1,58],90:[1,56],96:[1,37],100:[1,43],101:[1,55],103:38,104:[1,64],106:[1,65],107:39,108:[1,66],109:40,110:[1,67],111:68,119:[1,41],124:36,125:[1,63],127:[1,29],128:[1,30],129:[1,31],130:[1,32],131:[1,33],132:[1,34]},{6:[1,287],25:[1,288],26:[1,335]},{6:[2,40],25:[2,40],26:[2,40],54:[2,40],78:[2,40]},{6:[2,58],25:[2,58],26:[2,58],49:[2,58],54:[2,58]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],49:[2,175],54:[2,175],57:[2,175],73:[2,175],78:[2,175],86:[2,175],91:[2,175],93:[2,175],102:[2,175],104:[2,175],105:[2,175],106:[2,175],110:[2,175],118:[2,175],126:[2,175],129:[2,175],130:[2,175],133:[2,175],134:[2,175],135:[2,175],136:[2,175],137:[2,175],138:[2,175],139:[2,175]},{6:[2,128],25:[2,128],26:[2,128],54:[2,128],86:[2,128],91:[2,128]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],49:[2,172],54:[2,172],57:[2,172],73:[2,172],78:[2,172],86:[2,172],91:[2,172],93:[2,172],102:[2,172],103:84,104:[2,172],105:[2,172],106:[2,172],109:85,110:[2,172],111:68,118:[2,172],126:[2,172],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],49:[2,173],54:[2,173],57:[2,173],73:[2,173],78:[2,173],86:[2,173],91:[2,173],93:[2,173],102:[2,173],103:84,104:[2,173],105:[2,173],106:[2,173],109:85,110:[2,173],111:68,118:[2,173],126:[2,173],129:[1,76],130:[1,75],133:[1,74],134:[1,77],135:[1,78],136:[1,79],137:[1,80],138:[1,81],139:[1,82]},{6:[2,95],25:[2,95],26:[2,95],54:[2,95],78:[2,95]}],
defaultActions: {59:[2,50],60:[2,51],91:[2,109],192:[2,89]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3,"fs":1,"path":2}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var CoffeeScript, Module, binary, child_process, ext, findExtension, fork, helpers, loadFile, path, _i, _len, _ref;

  CoffeeScript = require('./coffee-script');

  child_process = require('child_process');

  helpers = require('./helpers');

  path = require('path');

  loadFile = function(module, filename) {
    var answer;
    answer = CoffeeScript._compileFile(filename, false);
    return module._compile(answer, filename);
  };

  if (require.extensions) {
    _ref = CoffeeScript.FILE_EXTENSIONS;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ext = _ref[_i];
      require.extensions[ext] = loadFile;
    }
    Module = require('module');
    findExtension = function(filename) {
      var curExtension, extensions;
      extensions = path.basename(filename).split('.');
      if (extensions[0] === '') {
        extensions.shift();
      }
      while (extensions.shift()) {
        curExtension = '.' + extensions.join('.');
        if (Module._extensions[curExtension]) {
          return curExtension;
        }
      }
      return '.js';
    };
    Module.prototype.load = function(filename) {
      var extension;
      this.filename = filename;
      this.paths = Module._nodeModulePaths(path.dirname(filename));
      extension = findExtension(filename);
      Module._extensions[extension](this, filename);
      return this.loaded = true;
    };
  }

  if (child_process) {
    fork = child_process.fork;
    binary = require.resolve('../../bin/coffee');
    child_process.fork = function(path, args, options) {
      if (helpers.isCoffee(path)) {
        if (!Array.isArray(args)) {
          options = args || {};
          args = [];
        }
        args = [path].concat(args);
        path = binary;
      }
      return fork(path, args, options);
    };
  }

}).call(this);

},{"./coffee-script":9,"./helpers":10,"child_process":1,"module":1,"path":2}],15:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var BALANCED_PAIRS, CALL_CLOSERS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, generate, left, rite, _i, _len, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  generate = function(tag, value, origin) {
    var tok;
    tok = [tag, value];
    tok.generated = true;
    if (origin) {
      tok.origin = origin;
    }
    return tok;
  };

  exports.Rewriter = (function() {
    function Rewriter() {}

    Rewriter.prototype.rewrite = function(tokens) {
      this.tokens = tokens;
      this.removeLeadingNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.normalizeLines();
      this.tagPostfixConditionals();
      this.addImplicitBracesAndParens();
      this.addLocationDataToGeneratedTokens();
      return this.tokens;
    };

    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };

    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, token, tokens, _ref, _ref1;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref1 = token[0], __indexOf.call(EXPRESSION_END, _ref1) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };

    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, tag, _i, _len, _ref;
      _ref = this.tokens;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };

    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.matchTags = function() {
      var fuzz, i, j, pattern, _i, _ref, _ref1;
      i = arguments[0], pattern = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      fuzz = 0;
      for (j = _i = 0, _ref = pattern.length; 0 <= _ref ? _i < _ref : _i > _ref; j = 0 <= _ref ? ++_i : --_i) {
        while (this.tag(i + j + fuzz) === 'HERECOMMENT') {
          fuzz += 2;
        }
        if (pattern[j] == null) {
          continue;
        }
        if (typeof pattern[j] === 'string') {
          pattern[j] = [pattern[j]];
        }
        if (_ref1 = this.tag(i + j + fuzz), __indexOf.call(pattern[j], _ref1) < 0) {
          return false;
        }
      }
      return true;
    };

    Rewriter.prototype.looksObjectish = function(j) {
      return this.matchTags(j, '@', null, ':') || this.matchTags(j, null, ':');
    };

    Rewriter.prototype.findTagsBackwards = function(i, tags) {
      var backStack, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      backStack = [];
      while (i >= 0 && (backStack.length || (_ref2 = this.tag(i), __indexOf.call(tags, _ref2) < 0) && ((_ref3 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref3) < 0) || this.tokens[i].generated) && (_ref4 = this.tag(i), __indexOf.call(LINEBREAKS, _ref4) < 0))) {
        if (_ref = this.tag(i), __indexOf.call(EXPRESSION_END, _ref) >= 0) {
          backStack.push(this.tag(i));
        }
        if ((_ref1 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref1) >= 0) && backStack.length) {
          backStack.pop();
        }
        i -= 1;
      }
      return _ref5 = this.tag(i), __indexOf.call(tags, _ref5) >= 0;
    };

    Rewriter.prototype.addImplicitBracesAndParens = function() {
      var stack;
      stack = [];
      return this.scanTokens(function(token, i, tokens) {
        var endImplicitCall, endImplicitObject, forward, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, newLine, nextTag, offset, prevTag, prevToken, s, sameLine, stackIdx, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
        tag = token[0];
        prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
        nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
        stackTop = function() {
          return stack[stack.length - 1];
        };
        startIdx = i;
        forward = function(n) {
          return i - startIdx + n;
        };
        inImplicit = function() {
          var _ref, _ref1;
          return (_ref = stackTop()) != null ? (_ref1 = _ref[2]) != null ? _ref1.ours : void 0 : void 0;
        };
        inImplicitCall = function() {
          var _ref;
          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '(';
        };
        inImplicitObject = function() {
          var _ref;
          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '{';
        };
        inImplicitControl = function() {
          var _ref;
          return inImplicit && ((_ref = stackTop()) != null ? _ref[0] : void 0) === 'CONTROL';
        };
        startImplicitCall = function(j) {
          var idx;
          idx = j != null ? j : i;
          stack.push([
            '(', idx, {
              ours: true
            }
          ]);
          tokens.splice(idx, 0, generate('CALL_START', '('));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitCall = function() {
          stack.pop();
          tokens.splice(i, 0, generate('CALL_END', ')'));
          return i += 1;
        };
        startImplicitObject = function(j, startsLine) {
          var idx;
          if (startsLine == null) {
            startsLine = true;
          }
          idx = j != null ? j : i;
          stack.push([
            '{', idx, {
              sameLine: true,
              startsLine: startsLine,
              ours: true
            }
          ]);
          tokens.splice(idx, 0, generate('{', generate(new String('{')), token));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitObject = function(j) {
          j = j != null ? j : i;
          stack.pop();
          tokens.splice(j, 0, generate('}', '}', token));
          return i += 1;
        };
        if (inImplicitCall() && (tag === 'IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
          stack.push([
            'CONTROL', i, {
              ours: true
            }
          ]);
          return forward(1);
        }
        if (tag === 'INDENT' && inImplicit()) {
          if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== '=') {
            while (inImplicitCall()) {
              endImplicitCall();
            }
          }
          if (inImplicitControl()) {
            stack.pop();
          }
          stack.push([tag, i]);
          return forward(1);
        }
        if (__indexOf.call(EXPRESSION_START, tag) >= 0) {
          stack.push([tag, i]);
          return forward(1);
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          while (inImplicit()) {
            if (inImplicitCall()) {
              endImplicitCall();
            } else if (inImplicitObject()) {
              endImplicitObject();
            } else {
              stack.pop();
            }
          }
          stack.pop();
        }
        if ((__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && token.spaced && !token.stringEnd || tag === '?' && i > 0 && !tokens[i - 1].spaced) && (__indexOf.call(IMPLICIT_CALL, nextTag) >= 0 || __indexOf.call(IMPLICIT_UNSPACED_CALL, nextTag) >= 0 && !((_ref = tokens[i + 1]) != null ? _ref.spaced : void 0) && !((_ref1 = tokens[i + 1]) != null ? _ref1.newLine : void 0))) {
          if (tag === '?') {
            tag = token[0] = 'FUNC_EXIST';
          }
          startImplicitCall(i + 1);
          return forward(2);
        }
        if (__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.matchTags(i + 1, 'INDENT', null, ':') && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
          startImplicitCall(i + 1);
          stack.push(['INDENT', i + 2]);
          return forward(3);
        }
        if (tag === ':') {
          if (this.tag(i - 2) === '@') {
            s = i - 2;
          } else {
            s = i - 1;
          }
          while (this.tag(s - 2) === 'HERECOMMENT') {
            s -= 2;
          }
          this.insideForDeclaration = nextTag === 'FOR';
          startsLine = s === 0 || (_ref2 = this.tag(s - 1), __indexOf.call(LINEBREAKS, _ref2) >= 0) || tokens[s - 1].newLine;
          if (stackTop()) {
            _ref3 = stackTop(), stackTag = _ref3[0], stackIdx = _ref3[1];
            if ((stackTag === '{' || stackTag === 'INDENT' && this.tag(stackIdx - 1) === '{') && (startsLine || this.tag(s - 1) === ',' || this.tag(s - 1) === '{')) {
              return forward(1);
            }
          }
          startImplicitObject(s, !!startsLine);
          return forward(2);
        }
        if (inImplicitObject() && __indexOf.call(LINEBREAKS, tag) >= 0) {
          stackTop()[2].sameLine = false;
        }
        newLine = prevTag === 'OUTDENT' || prevToken.newLine;
        if (__indexOf.call(IMPLICIT_END, tag) >= 0 || __indexOf.call(CALL_CLOSERS, tag) >= 0 && newLine) {
          while (inImplicit()) {
            _ref4 = stackTop(), stackTag = _ref4[0], stackIdx = _ref4[1], (_ref5 = _ref4[2], sameLine = _ref5.sameLine, startsLine = _ref5.startsLine);
            if (inImplicitCall() && prevTag !== ',') {
              endImplicitCall();
            } else if (inImplicitObject() && !this.insideForDeclaration && sameLine && tag !== 'TERMINATOR' && prevTag !== ':' && endImplicitObject()) {

            } else if (inImplicitObject() && tag === 'TERMINATOR' && prevTag !== ',' && !(startsLine && this.looksObjectish(i + 1))) {
              endImplicitObject();
            } else {
              break;
            }
          }
        }
        if (tag === ',' && !this.looksObjectish(i + 1) && inImplicitObject() && !this.insideForDeclaration && (nextTag !== 'TERMINATOR' || !this.looksObjectish(i + 2))) {
          offset = nextTag === 'OUTDENT' ? 1 : 0;
          while (inImplicitObject()) {
            endImplicitObject(i + offset);
          }
        }
        return forward(1);
      });
    };

    Rewriter.prototype.addLocationDataToGeneratedTokens = function() {
      return this.scanTokens(function(token, i, tokens) {
        var column, line, nextLocation, prevLocation, _ref, _ref1;
        if (token[2]) {
          return 1;
        }
        if (!(token.generated || token.explicit)) {
          return 1;
        }
        if (token[0] === '{' && (nextLocation = (_ref = tokens[i + 1]) != null ? _ref[2] : void 0)) {
          line = nextLocation.first_line, column = nextLocation.first_column;
        } else if (prevLocation = (_ref1 = tokens[i - 1]) != null ? _ref1[2] : void 0) {
          line = prevLocation.last_line, column = prevLocation.last_column;
        } else {
          line = column = 0;
        }
        token[2] = {
          first_line: line,
          first_column: column,
          last_line: line,
          last_column: column
        };
        return 1;
      });
    };

    Rewriter.prototype.normalizeLines = function() {
      var action, condition, indent, outdent, starter;
      starter = indent = outdent = null;
      condition = function(token, i) {
        var _ref, _ref1, _ref2, _ref3;
        return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'TERMINATOR' && (_ref1 = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref1) >= 0)) && !(token[0] === 'ELSE' && starter !== 'THEN') && !(((_ref2 = token[0]) === 'CATCH' || _ref2 === 'FINALLY') && (starter === '->' || starter === '=>')) || (_ref3 = token[0], __indexOf.call(CALL_CLOSERS, _ref3) >= 0) && this.tokens[i - 1].newLine;
      };
      action = function(token, i) {
        return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
      };
      return this.scanTokens(function(token, i, tokens) {
        var j, tag, _i, _ref, _ref1, _ref2;
        tag = token[0];
        if (tag === 'TERMINATOR') {
          if (this.tag(i + 1) === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
            tokens.splice.apply(tokens, [i, 1].concat(__slice.call(this.indentation())));
            return 1;
          }
          if (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0) {
            tokens.splice(i, 1);
            return 0;
          }
        }
        if (tag === 'CATCH') {
          for (j = _i = 1; _i <= 2; j = ++_i) {
            if (!((_ref1 = this.tag(i + j)) === 'OUTDENT' || _ref1 === 'TERMINATOR' || _ref1 === 'FINALLY')) {
              continue;
            }
            tokens.splice.apply(tokens, [i + j, 0].concat(__slice.call(this.indentation())));
            return 2 + j;
          }
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref2 = this.indentation(tokens[i]), indent = _ref2[0], outdent = _ref2[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          tokens.splice(i + 1, 0, indent);
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };

    Rewriter.prototype.tagPostfixConditionals = function() {
      var action, condition, original;
      original = null;
      condition = function(token, i) {
        var prevTag, tag;
        tag = token[0];
        prevTag = this.tokens[i - 1][0];
        return tag === 'TERMINATOR' || (tag === 'INDENT' && __indexOf.call(SINGLE_LINERS, prevTag) < 0);
      };
      action = function(token, i) {
        if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
          return original[0] = 'POST_' + original[0];
        }
      };
      return this.scanTokens(function(token, i) {
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.indentation = function(origin) {
      var indent, outdent;
      indent = ['INDENT', 2];
      outdent = ['OUTDENT', 2];
      if (origin) {
        indent.generated = outdent.generated = true;
        indent.origin = outdent.origin = origin;
      } else {
        indent.explicit = outdent.explicit = true;
      }
      return [indent, outdent];
    };

    Rewriter.prototype.generate = generate;

    Rewriter.prototype.tag = function(i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };

    return Rewriter;

  })();

  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];

  exports.INVERSES = INVERSES = {};

  EXPRESSION_START = [];

  EXPRESSION_END = [];

  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }

  EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'NULL', 'UNDEFINED', 'UNARY', 'UNARY_MATH', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

  IMPLICIT_UNSPACED_CALL = ['+', '-'];

  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

  CALL_CLOSERS = ['.', '?.', '::', '?::'];

}).call(this);

},{}],16:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var Scope, extend, last, _ref;

  _ref = require('./helpers'), extend = _ref.extend, last = _ref.last;

  exports.Scope = Scope = (function() {
    Scope.root = null;

    function Scope(parent, expressions, method) {
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.variables = [
        {
          name: 'arguments',
          type: 'arguments'
        }
      ];
      this.positions = {};
      if (!this.parent) {
        Scope.root = this;
      }
    }

    Scope.prototype.add = function(name, type, immediate) {
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
        return this.variables[this.positions[name]].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };

    Scope.prototype.namedMethod = function() {
      var _ref1;
      if (((_ref1 = this.method) != null ? _ref1.name : void 0) || !this.parent) {
        return this.method;
      }
      return this.parent.namedMethod();
    };

    Scope.prototype.find = function(name) {
      if (this.check(name)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };

    Scope.prototype.parameter = function(name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };

    Scope.prototype.check = function(name) {
      var _ref1;
      return !!(this.type(name) || ((_ref1 = this.parent) != null ? _ref1.check(name) : void 0));
    };

    Scope.prototype.temporary = function(name, index) {
      if (name.length > 1) {
        return '_' + name + (index > 1 ? index - 1 : '');
      } else {
        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      }
    };

    Scope.prototype.type = function(name) {
      var v, _i, _len, _ref1;
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };

    Scope.prototype.freeVariable = function(name, reserve) {
      var index, temp;
      if (reserve == null) {
        reserve = true;
      }
      index = 0;
      while (this.check((temp = this.temporary(name, index)))) {
        index++;
      }
      if (reserve) {
        this.add(temp, 'var', true);
      }
      return temp;
    };

    Scope.prototype.assign = function(name, value) {
      this.add(name, {
        value: value,
        assigned: true
      }, true);
      return this.hasAssignments = true;
    };

    Scope.prototype.hasDeclarations = function() {
      return !!this.declaredVariables().length;
    };

    Scope.prototype.declaredVariables = function() {
      var realVars, tempVars, v, _i, _len, _ref1;
      realVars = [];
      tempVars = [];
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type === 'var') {
          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
        }
      }
      return realVars.sort().concat(tempVars.sort());
    };

    Scope.prototype.assignedVariables = function() {
      var v, _i, _len, _ref1, _results;
      _ref1 = this.variables;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type.assigned) {
          _results.push("" + v.name + " = " + v.type.value);
        }
      }
      return _results;
    };

    return Scope;

  })();

}).call(this);

},{"./helpers":10}],17:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
(function() {
  var LineMap, SourceMap;

  LineMap = (function() {
    function LineMap(line) {
      this.line = line;
      this.columns = [];
    }

    LineMap.prototype.add = function(column, _arg, options) {
      var sourceColumn, sourceLine;
      sourceLine = _arg[0], sourceColumn = _arg[1];
      if (options == null) {
        options = {};
      }
      if (this.columns[column] && options.noReplace) {
        return;
      }
      return this.columns[column] = {
        line: this.line,
        column: column,
        sourceLine: sourceLine,
        sourceColumn: sourceColumn
      };
    };

    LineMap.prototype.sourceLocation = function(column) {
      var mapping;
      while (!((mapping = this.columns[column]) || (column <= 0))) {
        column--;
      }
      return mapping && [mapping.sourceLine, mapping.sourceColumn];
    };

    return LineMap;

  })();

  SourceMap = (function() {
    var BASE64_CHARS, VLQ_CONTINUATION_BIT, VLQ_SHIFT, VLQ_VALUE_MASK;

    function SourceMap() {
      this.lines = [];
    }

    SourceMap.prototype.add = function(sourceLocation, generatedLocation, options) {
      var column, line, lineMap, _base;
      if (options == null) {
        options = {};
      }
      line = generatedLocation[0], column = generatedLocation[1];
      lineMap = ((_base = this.lines)[line] || (_base[line] = new LineMap(line)));
      return lineMap.add(column, sourceLocation, options);
    };

    SourceMap.prototype.sourceLocation = function(_arg) {
      var column, line, lineMap;
      line = _arg[0], column = _arg[1];
      while (!((lineMap = this.lines[line]) || (line <= 0))) {
        line--;
      }
      return lineMap && lineMap.sourceLocation(column);
    };

    SourceMap.prototype.generate = function(options, code) {
      var buffer, lastColumn, lastSourceColumn, lastSourceLine, lineMap, lineNumber, mapping, needComma, v3, writingline, _i, _j, _len, _len1, _ref, _ref1;
      if (options == null) {
        options = {};
      }
      if (code == null) {
        code = null;
      }
      writingline = 0;
      lastColumn = 0;
      lastSourceLine = 0;
      lastSourceColumn = 0;
      needComma = false;
      buffer = "";
      _ref = this.lines;
      for (lineNumber = _i = 0, _len = _ref.length; _i < _len; lineNumber = ++_i) {
        lineMap = _ref[lineNumber];
        if (lineMap) {
          _ref1 = lineMap.columns;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            mapping = _ref1[_j];
            if (!(mapping)) {
              continue;
            }
            while (writingline < mapping.line) {
              lastColumn = 0;
              needComma = false;
              buffer += ";";
              writingline++;
            }
            if (needComma) {
              buffer += ",";
              needComma = false;
            }
            buffer += this.encodeVlq(mapping.column - lastColumn);
            lastColumn = mapping.column;
            buffer += this.encodeVlq(0);
            buffer += this.encodeVlq(mapping.sourceLine - lastSourceLine);
            lastSourceLine = mapping.sourceLine;
            buffer += this.encodeVlq(mapping.sourceColumn - lastSourceColumn);
            lastSourceColumn = mapping.sourceColumn;
            needComma = true;
          }
        }
      }
      v3 = {
        version: 3,
        file: options.generatedFile || '',
        sourceRoot: options.sourceRoot || '',
        sources: options.sourceFiles || [''],
        names: [],
        mappings: buffer
      };
      if (options.inline) {
        v3.sourcesContent = [code];
      }
      return JSON.stringify(v3, null, 2);
    };

    VLQ_SHIFT = 5;

    VLQ_CONTINUATION_BIT = 1 << VLQ_SHIFT;

    VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT - 1;

    SourceMap.prototype.encodeVlq = function(value) {
      var answer, nextChunk, signBit, valueToEncode;
      answer = '';
      signBit = value < 0 ? 1 : 0;
      valueToEncode = (Math.abs(value) << 1) + signBit;
      while (valueToEncode || !answer) {
        nextChunk = valueToEncode & VLQ_VALUE_MASK;
        valueToEncode = valueToEncode >> VLQ_SHIFT;
        if (valueToEncode) {
          nextChunk |= VLQ_CONTINUATION_BIT;
        }
        answer += this.encodeBase64(nextChunk);
      }
      return answer;
    };

    BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    SourceMap.prototype.encodeBase64 = function(value) {
      return BASE64_CHARS[value] || (function() {
        throw new Error("Cannot Base64 encode value: " + value);
      })();
    };

    return SourceMap;

  })();

  module.exports = SourceMap;

}).call(this);

},{}],18:[function(require,module,exports){
var SpliceArrayChunkSize,
  __slice = [].slice;

SpliceArrayChunkSize = 100000;

module.exports = {
  spliceArray: function(originalArray, start, length, insertedArray) {
    var chunk, chunkEnd, chunkStart, removedValues, _i, _ref;
    if (insertedArray == null) {
      insertedArray = [];
    }
    if (insertedArray.length < SpliceArrayChunkSize) {
      return originalArray.splice.apply(originalArray, [start, length].concat(__slice.call(insertedArray)));
    } else {
      removedValues = originalArray.splice(start, length);
      for (chunkStart = _i = 0, _ref = insertedArray.length; SpliceArrayChunkSize > 0 ? _i <= _ref : _i >= _ref; chunkStart = _i += SpliceArrayChunkSize) {
        chunkEnd = chunkStart + SpliceArrayChunkSize;
        chunk = insertedArray.slice(chunkStart, chunkEnd);
        originalArray.splice.apply(originalArray, [start + chunkStart, 0].concat(__slice.call(chunk)));
      }
      return removedValues;
    }
  },
  newlineRegex: /\r\n|\n|\r/g
};



},{}],19:[function(require,module,exports){
var Point;

module.exports = Point = (function() {
  Point.fromObject = function(object, copy) {
    var column, row;
    if (object instanceof Point) {
      if (copy) {
        return object.copy();
      } else {
        return object;
      }
    } else {
      if (Array.isArray(object)) {
        row = object[0], column = object[1];
      } else {
        row = object.row, column = object.column;
      }
      return new Point(row, column);
    }
  };

  Point.min = function(point1, point2) {
    point1 = this.fromObject(point1);
    point2 = this.fromObject(point2);
    if (point1.isLessThanOrEqual(point2)) {
      return point1;
    } else {
      return point2;
    }
  };

  function Point(row, column) {
    this.row = row != null ? row : 0;
    this.column = column != null ? column : 0;
  }

  Point.prototype.copy = function() {
    return new Point(this.row, this.column);
  };

  Point.prototype.freeze = function() {
    return Object.freeze(this);
  };

  Point.prototype.translate = function(delta) {
    var column, row, _ref;
    _ref = Point.fromObject(delta), row = _ref.row, column = _ref.column;
    return new Point(this.row + row, this.column + column);
  };

  Point.prototype.add = function(other) {
    var column, row;
    other = Point.fromObject(other);
    row = this.row + other.row;
    if (other.row === 0) {
      column = this.column + other.column;
    } else {
      column = other.column;
    }
    return new Point(row, column);
  };

  Point.prototype.splitAt = function(column) {
    var rightColumn;
    if (this.row === 0) {
      rightColumn = this.column - column;
    } else {
      rightColumn = this.column;
    }
    return [new Point(0, column), new Point(this.row, rightColumn)];
  };

  Point.prototype.compare = function(other) {
    if (this.row > other.row) {
      return 1;
    } else if (this.row < other.row) {
      return -1;
    } else {
      if (this.column > other.column) {
        return 1;
      } else if (this.column < other.column) {
        return -1;
      } else {
        return 0;
      }
    }
  };

  Point.prototype.isEqual = function(other) {
    if (!other) {
      return false;
    }
    other = Point.fromObject(other);
    return this.row === other.row && this.column === other.column;
  };

  Point.prototype.isLessThan = function(other) {
    return this.compare(other) < 0;
  };

  Point.prototype.isLessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };

  Point.prototype.isGreaterThan = function(other) {
    return this.compare(other) > 0;
  };

  Point.prototype.isGreaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };

  Point.prototype.toArray = function() {
    return [this.row, this.column];
  };

  Point.prototype.serialize = function() {
    return this.toArray();
  };

  Point.prototype.toString = function() {
    return "(" + this.row + ", " + this.column + ")";
  };

  return Point;

})();



},{}],20:[function(require,module,exports){
var Point, Range, newlineRegex,
  __slice = [].slice;

Point = require('./point');

newlineRegex = require('./helpers').newlineRegex;

module.exports = Range = (function() {
  Range.deserialize = function(array) {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(this, array, function(){});
  };

  Range.fromObject = function(object, copy) {
    if (Array.isArray(object)) {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(this, object, function(){});
    } else if (object instanceof this) {
      if (copy) {
        return object.copy();
      } else {
        return object;
      }
    } else {
      return new this(object.start, object.end);
    }
  };

  Range.fromText = function() {
    var args, endPoint, lastIndex, lines, startPoint, text;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length > 1) {
      startPoint = Point.fromObject(args.shift());
    } else {
      startPoint = new Point(0, 0);
    }
    text = args.shift();
    endPoint = startPoint.copy();
    lines = text.split(newlineRegex);
    if (lines.length > 1) {
      lastIndex = lines.length - 1;
      endPoint.row += lastIndex;
      endPoint.column = lines[lastIndex].length;
    } else {
      endPoint.column += lines[0].length;
    }
    return new this(startPoint, endPoint);
  };

  Range.fromPointWithDelta = function(startPoint, rowDelta, columnDelta) {
    var endPoint;
    startPoint = Point.fromObject(startPoint);
    endPoint = new Point(startPoint.row + rowDelta, startPoint.column + columnDelta);
    return new this(startPoint, endPoint);
  };

  function Range(pointA, pointB) {
    if (pointA == null) {
      pointA = new Point(0, 0);
    }
    if (pointB == null) {
      pointB = new Point(0, 0);
    }
    pointA = Point.fromObject(pointA);
    pointB = Point.fromObject(pointB);
    if (pointA.isLessThanOrEqual(pointB)) {
      this.start = pointA;
      this.end = pointB;
    } else {
      this.start = pointB;
      this.end = pointA;
    }
  }

  Range.prototype.serialize = function() {
    return [this.start.serialize(), this.end.serialize()];
  };

  Range.prototype.copy = function() {
    return new this.constructor(this.start.copy(), this.end.copy());
  };

  Range.prototype.freeze = function() {
    this.start.freeze();
    this.end.freeze();
    return Object.freeze(this);
  };

  Range.prototype.isEqual = function(other) {
    if (other == null) {
      return false;
    }
    other = this.constructor.fromObject(other);
    return other.start.isEqual(this.start) && other.end.isEqual(this.end);
  };

  Range.prototype.compare = function(other) {
    var value;
    other = this.constructor.fromObject(other);
    if (value = this.start.compare(other.start)) {
      return value;
    } else {
      return other.end.compare(this.end);
    }
  };

  Range.prototype.isSingleLine = function() {
    return this.start.row === this.end.row;
  };

  Range.prototype.coversSameRows = function(other) {
    return this.start.row === other.start.row && this.end.row === other.end.row;
  };

  Range.prototype.add = function(delta) {
    return new this.constructor(this.start.add(delta), this.end.add(delta));
  };

  Range.prototype.translate = function(startPoint, endPoint) {
    if (endPoint == null) {
      endPoint = startPoint;
    }
    return new this.constructor(this.start.translate(startPoint), this.end.translate(endPoint));
  };

  Range.prototype.intersectsWith = function(otherRange) {
    if (this.start.isLessThanOrEqual(otherRange.start)) {
      return this.end.isGreaterThanOrEqual(otherRange.start);
    } else {
      return otherRange.intersectsWith(this);
    }
  };

  Range.prototype.containsRange = function(otherRange, exclusive) {
    var end, start, _ref;
    _ref = this.constructor.fromObject(otherRange), start = _ref.start, end = _ref.end;
    return this.containsPoint(start, exclusive) && this.containsPoint(end, exclusive);
  };

  Range.prototype.containsPoint = function(point, exclusive) {
    if ((exclusive != null) && typeof exclusive === 'object') {
      exclusive = exclusive.exclusive;
    }
    point = Point.fromObject(point);
    if (exclusive) {
      return point.isGreaterThan(this.start) && point.isLessThan(this.end);
    } else {
      return point.isGreaterThanOrEqual(this.start) && point.isLessThanOrEqual(this.end);
    }
  };

  Range.prototype.intersectsRow = function(row) {
    return (this.start.row <= row && row <= this.end.row);
  };

  Range.prototype.intersectsRowRange = function(startRow, endRow) {
    var _ref;
    if (startRow > endRow) {
      _ref = [endRow, startRow], startRow = _ref[0], endRow = _ref[1];
    }
    return this.end.row >= startRow && endRow >= this.start.row;
  };

  Range.prototype.union = function(otherRange) {
    var end, start;
    start = this.start.isLessThan(otherRange.start) ? this.start : otherRange.start;
    end = this.end.isGreaterThan(otherRange.end) ? this.end : otherRange.end;
    return new this.constructor(start, end);
  };

  Range.prototype.isEmpty = function() {
    return this.start.isEqual(this.end);
  };

  Range.prototype.toDelta = function() {
    var columns, rows;
    rows = this.end.row - this.start.row;
    if (rows === 0) {
      columns = this.end.column - this.start.column;
    } else {
      columns = this.end.column;
    }
    return new Point(rows, columns);
  };

  Range.prototype.getRowCount = function() {
    return this.end.row - this.start.row + 1;
  };

  Range.prototype.getRows = function() {
    var _i, _ref, _ref1, _results;
    return (function() {
      _results = [];
      for (var _i = _ref = this.start.row, _ref1 = this.end.row; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; _ref <= _ref1 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this);
  };

  Range.prototype.toString = function() {
    return "[" + this.start + " - " + this.end + "]";
  };

  return Range;

})();



},{"./helpers":18,"./point":19}]},{},[8])