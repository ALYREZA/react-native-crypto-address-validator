(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WAValidator = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){
/* bignumber.js v1.3.0 https://github.com/MikeMcl/bignumber.js/LICENCE */

/*jslint bitwise: true, eqeq: true, plusplus: true, sub: true, white: true, maxerr: 500 */
/*global module */

/*
  bignumber.js v1.3.0
  A JavaScript library for arbitrary-precision arithmetic.
  https://github.com/MikeMcl/bignumber.js
  Copyright (c) 2012 Michael Mclaughlin <M8ch88l@gmail.com>
  MIT Expat Licence
*/

/*********************************** DEFAULTS ************************************/

/*
 * The default values below must be integers within the stated ranges (inclusive).
 * Most of these values can be changed during run-time using BigNumber.config().
 */

/*
 * The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP,
 * MAX_EXP, and the argument to toFixed, toPrecision and toExponential, beyond
 * which an exception is thrown (if ERRORS is true).
 */
var MAX = 1E9,                                   // 0 to 1e+9

    // Limit of magnitude of exponent argument to toPower.
    MAX_POWER = 1E6,                             // 1 to 1e+6

    // The maximum number of decimal places for operations involving division.
    DECIMAL_PLACES = 20,                         // 0 to MAX

    /*
     * The rounding mode used when rounding to the above decimal places, and when
     * using toFixed, toPrecision and toExponential, and round (default value).
     * UP         0 Away from zero.
     * DOWN       1 Towards zero.
     * CEIL       2 Towards +Infinity.
     * FLOOR      3 Towards -Infinity.
     * HALF_UP    4 Towards nearest neighbour. If equidistant, up.
     * HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
     * HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
     * HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
     * HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
     */
    ROUNDING_MODE = 4,                           // 0 to 8

    // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

    // The exponent value at and beneath which toString returns exponential notation.
    // Number type: -7
    TO_EXP_NEG = -7,                             // 0 to -MAX

    // The exponent value at and above which toString returns exponential notation.
    // Number type: 21
    TO_EXP_POS = 21,                             // 0 to MAX

    // RANGE : [MIN_EXP, MAX_EXP]

    // The minimum exponent value, beneath which underflow to zero occurs.
    // Number type: -324  (5e-324)
    MIN_EXP = -MAX,                              // -1 to -MAX

    // The maximum exponent value, above which overflow to Infinity occurs.
    // Number type:  308  (1.7976931348623157e+308)
    MAX_EXP = MAX,                               // 1 to MAX

    // Whether BigNumber Errors are ever thrown.
    // CHANGE parseInt to parseFloat if changing ERRORS to false.
    ERRORS = true,                               // true or false
    parse = parseInt,                            // parseInt or parseFloat

/***********************************************************************************/

    P = BigNumber.prototype,
    DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
    outOfRange,
    id = 0,
    isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
    trim = String.prototype.trim || function () {return this.replace(/^\s+|\s+$/g, '')},
    ONE = BigNumber(1);


// CONSTRUCTOR


/*
 * The exported function.
 * Create and return a new instance of a BigNumber object.
 *
 * n {number|string|BigNumber} A numeric value.
 * [b] {number} The base of n. Integer, 2 to 64 inclusive.
 */
function BigNumber( n, b ) {
    var e, i, isNum, digits, valid, orig,
        x = this;

    // Enable constructor usage without new.
    if ( !(x instanceof BigNumber) ) {
        return new BigNumber( n, b )
    }

    // Duplicate.
    if ( n instanceof BigNumber ) {
        id = 0;

        // e is undefined.
        if ( b !== e ) {
            n += ''
        } else {
            x['s'] = n['s'];
            x['e'] = n['e'];
            x['c'] = ( n = n['c'] ) ? n.slice() : n;
            return;
        }
    }

    // If number, check if minus zero.
    if ( typeof n != 'string' ) {
        n = ( isNum = typeof n == 'number' ||
            Object.prototype.toString.call(n) == '[object Number]' ) &&
                n === 0 && 1 / n < 0 ? '-0' : n + '';
    }

    orig = n;

    if ( b === e && isValid.test(n) ) {

        // Determine sign.
        x['s'] = n.charAt(0) == '-' ? ( n = n.slice(1), -1 ) : 1;

    // Either n is not a valid BigNumber or a base has been specified.
    } else {

        // Enable exponential notation to be used with base 10 argument.
        // Ensure return value is rounded to DECIMAL_PLACES as with other bases.
        if ( b == 10 ) {

            return setMode( n, DECIMAL_PLACES, ROUNDING_MODE );
        }

        n = trim.call(n).replace( /^\+(?!-)/, '' );

        x['s'] = n.charAt(0) == '-' ? ( n = n.replace( /^-(?!-)/, '' ), -1 ) : 1;

        if ( b != null ) {

            if ( ( b == (b | 0) || !ERRORS ) &&
              !( outOfRange = !( b >= 2 && b < 65 ) ) ) {

                digits = '[' + DIGITS.slice( 0, b = b | 0 ) + ']+';

                // Before non-decimal number validity test and base conversion
                // remove the `.` from e.g. '1.', and replace e.g. '.1' with '0.1'.
                n = n.replace( /\.$/, '' ).replace( /^\./, '0.' );

                // Any number in exponential form will fail due to the e+/-.
                if ( valid = new RegExp(
                  '^' + digits + '(?:\\.' + digits + ')?$', b < 37 ? 'i' : '' ).test(n) ) {

                    if ( isNum ) {

                        if ( n.replace( /^0\.0*|\./, '' ).length > 15 ) {

                            // 'new BigNumber() number type has more than 15 significant digits: {n}'
                            ifExceptionsThrow( orig, 0 );
                        }

                        // Prevent later check for length on converted number.
                        isNum = !isNum;
                    }
                    n = convert( n, 10, b, x['s'] );

                } else if ( n != 'Infinity' && n != 'NaN' ) {

                    // 'new BigNumber() not a base {b} number: {n}'
                    ifExceptionsThrow( orig, 1, b );
                    n = 'NaN';
                }
            } else {

                // 'new BigNumber() base not an integer: {b}'
                // 'new BigNumber() base out of range: {b}'
                ifExceptionsThrow( b, 2 );

                // Ignore base.
                valid = isValid.test(n);
            }
        } else {
            valid = isValid.test(n);
        }

        if ( !valid ) {

            // Infinity/NaN
            x['c'] = x['e'] = null;

            // NaN
            if ( n != 'Infinity' ) {

                // No exception on NaN.
                if ( n != 'NaN' ) {

                    // 'new BigNumber() not a number: {n}'
                    ifExceptionsThrow( orig, 3 );
                }
                x['s'] = null;
            }
            id = 0;

            return;
        }
    }

    // Decimal point?
    if ( ( e = n.indexOf('.') ) > -1 ) {
        n = n.replace( '.', '' );
    }

    // Exponential form?
    if ( ( i = n.search( /e/i ) ) > 0 ) {

        // Determine exponent.
        if ( e < 0 ) {
            e = i;
        }
        e += +n.slice( i + 1 );
        n = n.substring( 0, i );

    } else if ( e < 0 ) {

        // Integer.
        e = n.length;
    }

    // Determine leading zeros.
    for ( i = 0; n.charAt(i) == '0'; i++ ) {
    }

    b = n.length;

    // Disallow numbers with over 15 significant digits if number type.
    if ( isNum && b > 15 && n.slice(i).length > 15 ) {

        // 'new BigNumber() number type has more than 15 significant digits: {n}'
        ifExceptionsThrow( orig, 0 );
    }
    id = 0;

    // Overflow?
    if ( ( e -= i + 1 ) > MAX_EXP ) {

        // Infinity.
        x['c'] = x['e'] = null;

    // Zero or underflow?
    } else if ( i == b || e < MIN_EXP ) {

        // Zero.
        x['c'] = [ x['e'] = 0 ];
    } else {

        // Determine trailing zeros.
        for ( ; n.charAt(--b) == '0'; ) {
        }

        x['e'] = e;
        x['c'] = [];

        // Convert string to array of digits (without leading and trailing zeros).
        for ( e = 0; i <= b; x['c'][e++] = +n.charAt(i++) ) {
        }
    }
}


// CONSTRUCTOR PROPERTIES/METHODS


BigNumber['ROUND_UP'] = 0;
BigNumber['ROUND_DOWN'] = 1;
BigNumber['ROUND_CEIL'] = 2;
BigNumber['ROUND_FLOOR'] = 3;
BigNumber['ROUND_HALF_UP'] = 4;
BigNumber['ROUND_HALF_DOWN'] = 5;
BigNumber['ROUND_HALF_EVEN'] = 6;
BigNumber['ROUND_HALF_CEIL'] = 7;
BigNumber['ROUND_HALF_FLOOR'] = 8;

/*
 * Create an instance from a Buffer
 */
BigNumber['fromBuffer'] = function (buf, opts) {

    if (!opts) opts = {};

    var endian = { 1 : 'big', '-1' : 'little' }[opts.endian]
        || opts.endian || 'big'
    ;

    var size = opts.size === 'auto' ? Math.ceil(buf.length) : (opts.size || 1);

    if (buf.length % size !== 0) {
        throw new RangeError('Buffer length (' + buf.length + ')'
            + ' must be a multiple of size (' + size + ')'
        );
    }

    var hex = [];
    for (var i = 0; i < buf.length; i += size) {
        var chunk = [];
        for (var j = 0; j < size; j++) {
            chunk.push(buf[
                i + (endian === 'big' ? j : (size - j - 1))
            ]);
        }

        hex.push(chunk
            .map(function (c) {
                return (c < 16 ? '0' : '') + c.toString(16);
            })
            .join('')
        );
    }

    return BigNumber(hex.join(''), 16);

};

/*
 * Configure infrequently-changing library-wide settings.
 *
 * Accept an object or an argument list, with one or many of the following
 * properties or parameters respectively:
 * [ DECIMAL_PLACES [, ROUNDING_MODE [, EXPONENTIAL_AT [, RANGE [, ERRORS ]]]]]
 *
 * E.g.
 * BigNumber.config(20, 4) is equivalent to
 * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
 * Ignore properties/parameters set to null or undefined.
 *
 * Return an object with the properties current values.
 */
BigNumber['config'] = function () {
    var v, p,
        i = 0,
        r = {},
        a = arguments,
        o = a[0],
        c = 'config',
        inRange = function ( n, lo, hi ) {
          return !( ( outOfRange = n < lo || n > hi ) ||
            parse(n) != n && n !== 0 );
        },
        has = o && typeof o == 'object'
          ? function () {if ( o.hasOwnProperty(p) ) return ( v = o[p] ) != null}
          : function () {if ( a.length > i ) return ( v = a[i++] ) != null};

    // [DECIMAL_PLACES] {number} Integer, 0 to MAX inclusive.
    if ( has( p = 'DECIMAL_PLACES' ) ) {

        if ( inRange( v, 0, MAX ) ) {
            DECIMAL_PLACES = v | 0;
        } else {

            // 'config() DECIMAL_PLACES not an integer: {v}'
            // 'config() DECIMAL_PLACES out of range: {v}'
            ifExceptionsThrow( v, p, c );
        }
    }
    r[p] = DECIMAL_PLACES;

    // [ROUNDING_MODE] {number} Integer, 0 to 8 inclusive.
    if ( has( p = 'ROUNDING_MODE' ) ) {

        if ( inRange( v, 0, 8 ) ) {
            ROUNDING_MODE = v | 0;
        } else {

            // 'config() ROUNDING_MODE not an integer: {v}'
            // 'config() ROUNDING_MODE out of range: {v}'
            ifExceptionsThrow( v, p, c );
        }
    }
    r[p] = ROUNDING_MODE;

    /*
     * [EXPONENTIAL_AT] {number|number[]} Integer, -MAX to MAX inclusive or
     * [ integer -MAX to 0 inclusive, 0 to MAX inclusive ].
     */
    if ( has( p = 'EXPONENTIAL_AT' ) ) {

        if ( inRange( v, -MAX, MAX ) ) {
            TO_EXP_NEG = -( TO_EXP_POS = ~~( v < 0 ? -v : +v ) );
        } else if ( !outOfRange && v && inRange( v[0], -MAX, 0 ) &&
          inRange( v[1], 0, MAX ) ) {
            TO_EXP_NEG = ~~v[0];
            TO_EXP_POS = ~~v[1];
        } else {

            // 'config() EXPONENTIAL_AT not an integer or not [integer, integer]: {v}'
            // 'config() EXPONENTIAL_AT out of range or not [negative, positive: {v}'
            ifExceptionsThrow( v, p, c, 1 );
        }
    }
    r[p] = [ TO_EXP_NEG, TO_EXP_POS ];

    /*
     * [RANGE][ {number|number[]} Non-zero integer, -MAX to MAX inclusive or
     * [ integer -MAX to -1 inclusive, integer 1 to MAX inclusive ].
     */
    if ( has( p = 'RANGE' ) ) {

        if ( inRange( v, -MAX, MAX ) && ~~v ) {
            MIN_EXP = -( MAX_EXP = ~~( v < 0 ? -v : +v ) );
        } else if ( !outOfRange && v && inRange( v[0], -MAX, -1 ) &&
          inRange( v[1], 1, MAX ) ) {
            MIN_EXP = ~~v[0], MAX_EXP = ~~v[1];
        } else {

            // 'config() RANGE not a non-zero integer or not [integer, integer]: {v}'
            // 'config() RANGE out of range or not [negative, positive: {v}'
            ifExceptionsThrow( v, p, c, 1, 1 );
        }
    }
    r[p] = [ MIN_EXP, MAX_EXP ];

    // [ERRORS] {boolean|number} true, false, 1 or 0.
    if ( has( p = 'ERRORS' ) ) {

        if ( v === !!v || v === 1 || v === 0 ) {
            parse = ( outOfRange = id = 0, ERRORS = !!v )
              ? parseInt
              : parseFloat;
        } else {

            // 'config() ERRORS not a boolean or binary digit: {v}'
            ifExceptionsThrow( v, p, c, 0, 0, 1 );
        }
    }
    r[p] = ERRORS;

    return r;
};


// PRIVATE FUNCTIONS


// Assemble error messages. Throw BigNumber Errors.
function ifExceptionsThrow( arg, i, j, isArray, isRange, isErrors) {

    if ( ERRORS ) {
        var error,
            method = ['new BigNumber', 'cmp', 'div', 'eq', 'gt', 'gte', 'lt',
                 'lte', 'minus', 'mod', 'plus', 'times', 'toFr'
                ][ id ? id < 0 ? -id : id : 1 / id < 0 ? 1 : 0 ] + '()',
            message = outOfRange ? ' out of range' : ' not a' +
              ( isRange ? ' non-zero' : 'n' ) + ' integer';

        message = ( [
            method + ' number type has more than 15 significant digits',
            method + ' not a base ' + j + ' number',
            method + ' base' + message,
            method + ' not a number' ][i] ||
              j + '() ' + i + ( isErrors
                ? ' not a boolean or binary digit'
                : message + ( isArray
                  ? ' or not [' + ( outOfRange
                    ? ' negative, positive'
                    : ' integer, integer' ) + ' ]'
                  : '' ) ) ) + ': ' + arg;

        outOfRange = id = 0;
        error = new Error(message);
        error['name'] = 'BigNumber Error';

        throw error;
    }
}


/*
 * Convert a numeric string of baseIn to a numeric string of baseOut.
 */
function convert( nStr, baseOut, baseIn, sign ) {
    var e, dvs, dvd, nArr, fracArr, fracBN;

    // Convert string of base bIn to an array of numbers of baseOut.
    // Eg. strToArr('255', 10) where baseOut is 16, returns [15, 15].
    // Eg. strToArr('ff', 16)  where baseOut is 10, returns [2, 5, 5].
    function strToArr( str, bIn ) {
        var j,
            i = 0,
            strL = str.length,
            arrL,
            arr = [0];

        for ( bIn = bIn || baseIn; i < strL; i++ ) {

            for ( arrL = arr.length, j = 0; j < arrL; arr[j] *= bIn, j++ ) {
            }

            for ( arr[0] += DIGITS.indexOf( str.charAt(i) ), j = 0;
                  j < arr.length;
                  j++ ) {

                if ( arr[j] > baseOut - 1 ) {

                    if ( arr[j + 1] == null ) {
                        arr[j + 1] = 0;
                    }
                    arr[j + 1] += arr[j] / baseOut ^ 0;
                    arr[j] %= baseOut;
                }
            }
        }

        return arr.reverse();
    }

    // Convert array to string.
    // E.g. arrToStr( [9, 10, 11] ) becomes '9ab' (in bases above 11).
    function arrToStr( arr ) {
        var i = 0,
            arrL = arr.length,
            str = '';

        for ( ; i < arrL; str += DIGITS.charAt( arr[i++] ) ) {
        }

        return str;
    }

    if ( baseIn < 37 ) {
        nStr = nStr.toLowerCase();
    }

    /*
     * If non-integer convert integer part and fraction part separately.
     * Convert the fraction part as if it is an integer than use division to
     * reduce it down again to a value less than one.
     */
    if ( ( e = nStr.indexOf( '.' ) ) > -1 ) {

        /*
         * Calculate the power to which to raise the base to get the number
         * to divide the fraction part by after it has been converted as an
         * integer to the required base.
         */
        e = nStr.length - e - 1;

        // Use toFixed to avoid possible exponential notation.
        dvs = strToArr( new BigNumber(baseIn)['pow'](e)['toF'](), 10 );

        nArr = nStr.split('.');

        // Convert the base of the fraction part (as integer).
        dvd = strToArr( nArr[1] );

        // Convert the base of the integer part.
        nArr = strToArr( nArr[0] );

        // Result will be a BigNumber with a value less than 1.
        fracBN = divide( dvd, dvs, dvd.length - dvs.length, sign, baseOut,
          // Is least significant digit of integer part an odd number?
          nArr[nArr.length - 1] & 1 );

        fracArr = fracBN['c'];

        // e can be <= 0  ( if e == 0, fracArr is [0] or [1] ).
        if ( e = fracBN['e'] ) {

            // Append zeros according to the exponent of the result.
            for ( ; ++e; fracArr.unshift(0) ) {
            }

            // Append the fraction part to the converted integer part.
            nStr = arrToStr(nArr) + '.' + arrToStr(fracArr);

        // fracArr is [1].
        // Fraction digits rounded up, so increment last digit of integer part.
        } else if ( fracArr[0] ) {

            if ( nArr[ e = nArr.length - 1 ] < baseOut - 1 ) {
                ++nArr[e];
                nStr = arrToStr(nArr);
            } else {
                nStr = new BigNumber( arrToStr(nArr),
                  baseOut )['plus'](ONE)['toS'](baseOut);
            }

        // fracArr is [0]. No fraction digits.
        } else {
            nStr = arrToStr(nArr);
        }
    } else {

        // Simple integer. Convert base.
        nStr = arrToStr( strToArr(nStr) );
    }

    return nStr;
}


// Perform division in the specified base. Called by div and convert.
function divide( dvd, dvs, exp, s, base, isOdd ) {
    var dvsL, dvsT, next, cmp, remI,
        dvsZ = dvs.slice(),
        dvdI = dvsL = dvs.length,
        dvdL = dvd.length,
        rem = dvd.slice( 0, dvsL ),
        remL = rem.length,
        quo = new BigNumber(ONE),
        qc = quo['c'] = [],
        qi = 0,
        dig = DECIMAL_PLACES + ( quo['e'] = exp ) + 1;

    quo['s'] = s;
    s = dig < 0 ? 0 : dig;

    // Add zeros to make remainder as long as divisor.
    for ( ; remL++ < dvsL; rem.push(0) ) {
    }

    // Create version of divisor with leading zero.
    dvsZ.unshift(0);

    do {

        // 'next' is how many times the divisor goes into the current remainder.
        for ( next = 0; next < base; next++ ) {

            // Compare divisor and remainder.
            if ( dvsL != ( remL = rem.length ) ) {
                cmp = dvsL > remL ? 1 : -1;
            } else {
                for ( remI = -1, cmp = 0; ++remI < dvsL; ) {

                    if ( dvs[remI] != rem[remI] ) {
                        cmp = dvs[remI] > rem[remI] ? 1 : -1;
                        break;
                    }
                }
            }

            // Subtract divisor from remainder (if divisor < remainder).
            if ( cmp < 0 ) {

                // Remainder cannot be more than one digit longer than divisor.
                // Equalise lengths using divisor with extra leading zero?
                for ( dvsT = remL == dvsL ? dvs : dvsZ; remL; ) {

                    if ( rem[--remL] < dvsT[remL] ) {

                        for ( remI = remL;
                          remI && !rem[--remI];
                            rem[remI] = base - 1 ) {
                        }
                        --rem[remI];
                        rem[remL] += base;
                    }
                    rem[remL] -= dvsT[remL];
                }
                for ( ; !rem[0]; rem.shift() ) {
                }
            } else {
                break;
            }
        }

        // Add the 'next' digit to the result array.
        qc[qi++] = cmp ? next : ++next;

        // Update the remainder.
        rem[0] && cmp
          ? ( rem[remL] = dvd[dvdI] || 0 )
          : ( rem = [ dvd[dvdI] ] );

    } while ( ( dvdI++ < dvdL || rem[0] != null ) && s-- );

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if ( !qc[0] && qi != 1 ) {

        // There can't be more than one zero.
        --quo['e'];
        qc.shift();
    }

    // Round?
    if ( qi > dig ) {
        rnd( quo, DECIMAL_PLACES, base, isOdd, rem[0] != null );
    }

    // Overflow?
    if ( quo['e'] > MAX_EXP ) {

        // Infinity.
        quo['c'] = quo['e'] = null;

    // Underflow?
    } else if ( quo['e'] < MIN_EXP ) {

        // Zero.
        quo['c'] = [quo['e'] = 0];
    }

    return quo;
}


/*
 * Return a string representing the value of BigNumber n in normal or
 * exponential notation rounded to the specified decimal places or
 * significant digits.
 * Called by toString, toExponential (exp 1), toFixed, and toPrecision (exp 2).
 * d is the index (with the value in normal notation) of the digit that may be
 * rounded up.
 */
function format( n, d, exp ) {

    // Initially, i is the number of decimal places required.
    var i = d - (n = new BigNumber(n))['e'],
        c = n['c'];

    // +-Infinity or NaN?
    if ( !c ) {
        return n['toS']();
    }

    // Round?
    if ( c.length > ++d ) {
        rnd( n, i, 10 );
    }

    // Recalculate d if toFixed as n['e'] may have changed if value rounded up.
    i = c[0] == 0 ? i + 1 : exp ? d : n['e'] + i + 1;

    // Append zeros?
    for ( ; c.length < i; c.push(0) ) {
    }
    i = n['e'];

    /*
     * toPrecision returns exponential notation if the number of significant
     * digits specified is less than the number of digits necessary to
     * represent the integer part of the value in normal notation.
     */
    return exp == 1 || exp == 2 && ( --d < i || i <= TO_EXP_NEG )

      // Exponential notation.
      ? ( n['s'] < 0 && c[0] ? '-' : '' ) + ( c.length > 1
        ? ( c.splice( 1, 0, '.' ), c.join('') )
        : c[0] ) + ( i < 0 ? 'e' : 'e+' ) + i

      // Normal notation.
      : n['toS']();
}


// Round if necessary.
// Called by divide, format, setMode and sqrt.
function rnd( x, dp, base, isOdd, r ) {
    var xc = x['c'],
        isNeg = x['s'] < 0,
        half = base / 2,
        i = x['e'] + dp + 1,

        // 'next' is the digit after the digit that may be rounded up.
        next = xc[i],

        /*
         * 'more' is whether there are digits after 'next'.
         * E.g.
         * 0.005 (e = -3) to be rounded to 0 decimal places (dp = 0) gives i = -2
         * The 'next' digit is zero, and there ARE 'more' digits after it.
         * 0.5 (e = -1) dp = 0 gives i = 0
         * The 'next' digit is 5 and there are no 'more' digits after it.
         */
        more = r || i < 0 || xc[i + 1] != null;

    r = ROUNDING_MODE < 4
      ? ( next != null || more ) &&
        ( ROUNDING_MODE == 0 ||
           ROUNDING_MODE == 2 && !isNeg ||
             ROUNDING_MODE == 3 && isNeg )
      : next > half || next == half &&
        ( ROUNDING_MODE == 4 || more ||

          /*
           * isOdd is used in base conversion and refers to the least significant
           * digit of the integer part of the value to be converted. The fraction
           * part is rounded by this method separately from the integer part.
           */
          ROUNDING_MODE == 6 && ( xc[i - 1] & 1 || !dp && isOdd ) ||
            ROUNDING_MODE == 7 && !isNeg ||
              ROUNDING_MODE == 8 && isNeg );

    if ( i < 1 || !xc[0] ) {
        xc.length = 0;
        xc.push(0);

        if ( r ) {

            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
            xc[0] = 1;
            x['e'] = -dp;
        } else {

            // Zero.
            x['e'] = 0;
        }

        return x;
    }

    // Remove any digits after the required decimal places.
    xc.length = i--;

    // Round up?
    if ( r ) {

        // Rounding up may mean the previous digit has to be rounded up and so on.
        for ( --base; ++xc[i] > base; ) {
            xc[i] = 0;

            if ( !i-- ) {
                ++x['e'];
                xc.unshift(1);
            }
        }
    }

    // Remove trailing zeros.
    for ( i = xc.length; !xc[--i]; xc.pop() ) {
    }

    return x;
}


// Round after setting the appropriate rounding mode.
// Handles ceil, floor and round.
function setMode( x, dp, rm ) {
    var r = ROUNDING_MODE;

    ROUNDING_MODE = rm;
    x = new BigNumber(x);
    x['c'] && rnd( x, dp, 10 );
    ROUNDING_MODE = r;

    return x;
}


// PROTOTYPE/INSTANCE METHODS


/*
 * Return a new BigNumber whose value is the absolute value of this BigNumber.
 */
P['abs'] = P['absoluteValue'] = function () {
    var x = new BigNumber(this);

    if ( x['s'] < 0 ) {
        x['s'] = 1;
    }

    return x;
};

/*
 * Return the bit length of the number.
 */
P['bitLength'] = function () {
    return this.toString(2).length;
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a whole number in the direction of Infinity.
 */
P['ceil'] = function () {
    return setMode( this, 0, 2 );
};


/*
 * Return
 * 1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
 * -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
 * 0 if they have the same value,
 * or null if the value of either is NaN.
 */
P['comparedTo'] = P['cmp'] = function ( y, b ) {
    var a,
        x = this,
        xc = x['c'],
        yc = ( id = -id, y = new BigNumber( y, b ) )['c'],
        i = x['s'],
        j = y['s'],
        k = x['e'],
        l = y['e'];

    // Either NaN?
    if ( !i || !j ) {
        return null;
    }

    a = xc && !xc[0], b = yc && !yc[0];

    // Either zero?
    if ( a || b ) {
        return a ? b ? 0 : -j : i;
    }

    // Signs differ?
    if ( i != j ) {
        return i;
    }

    // Either Infinity?
    if ( a = i < 0, b = k == l, !xc || !yc ) {
        return b ? 0 : !xc ^ a ? 1 : -1;
    }

    // Compare exponents.
    if ( !b ) {
        return k > l ^ a ? 1 : -1;
    }

    // Compare digit by digit.
    for ( i = -1,
          j = ( k = xc.length ) < ( l = yc.length ) ? k : l;
          ++i < j; ) {

        if ( xc[i] != yc[i] ) {
            return xc[i] > yc[i] ^ a ? 1 : -1;
        }
    }
    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
};


/*
 *  n / 0 = I
 *  n / N = N
 *  n / I = 0
 *  0 / n = 0
 *  0 / 0 = N
 *  0 / N = N
 *  0 / I = 0
 *  N / n = N
 *  N / 0 = N
 *  N / N = N
 *  N / I = N
 *  I / n = I
 *  I / 0 = I
 *  I / N = N
 *  I / I = N
 *
 * Return a new BigNumber whose value is the value of this BigNumber
 * divided by the value of BigNumber(y, b), rounded according to
 * DECIMAL_PLACES and ROUNDING_MODE.
 */
P['dividedBy'] = P['div'] = function ( y, b ) {
    var xc = this['c'],
        xe = this['e'],
        xs = this['s'],
        yc = ( id = 2, y = new BigNumber( y, b ) )['c'],
        ye = y['e'],
        ys = y['s'],
        s = xs == ys ? 1 : -1;

    // Either NaN/Infinity/0?
    return !xe && ( !xc || !xc[0] ) || !ye && ( !yc || !yc[0] )

      // Either NaN?
      ? new BigNumber( !xs || !ys ||

        // Both 0 or both Infinity?
        ( xc ? yc && xc[0] == yc[0] : !yc )

          // Return NaN.
          ? NaN

          // x is 0 or y is Infinity?
          : xc && xc[0] == 0 || !yc

            // Return +-0.
            ? s * 0

            // y is 0. Return +-Infinity.
            : s / 0 )

      : divide( xc, yc, xe - ye, s, 10 );
};


/*
 * Return true if the value of this BigNumber is equal to the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['equals'] = P['eq'] = function ( n, b ) {
    id = 3;
    return this['cmp']( n, b ) === 0;
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a whole number in the direction of -Infinity.
 */
P['floor'] = function () {
    return setMode( this, 0, 3 );
};


/*
 * Return true if the value of this BigNumber is greater than the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['greaterThan'] = P['gt'] = function ( n, b ) {
    id = 4;
    return this['cmp']( n, b ) > 0;
};


/*
 * Return true if the value of this BigNumber is greater than or equal to
 * the value of BigNumber(n, b), otherwise returns false.
 */
P['greaterThanOrEqualTo'] = P['gte'] = P['gt'] = function ( n, b ) {
    id = 5;
    return ( b = this['cmp']( n, b ) ) == 1 || b === 0;
};


/*
 * Return true if the value of this BigNumber is a finite number, otherwise
 * returns false.
 */
P['isFinite'] = P['isF'] = function () {
    return !!this['c'];
};


/*
 * Return true if the value of this BigNumber is NaN, otherwise returns
 * false.
 */
P['isNaN'] = function () {
    return !this['s'];
};


/*
 * Return true if the value of this BigNumber is negative, otherwise
 * returns false.
 */
P['isNegative'] = P['isNeg'] = function () {
    return this['s'] < 0;
};


/*
 * Return true if the value of this BigNumber is 0 or -0, otherwise returns
 * false.
 */
P['isZero'] = P['isZ'] = function () {
    return !!this['c'] && this['c'][0] == 0;
};


/*
 * Return true if the value of this BigNumber is less than the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['lessThan'] = P['lt'] = function ( n, b ) {
    id = 6;
    return this['cmp']( n, b ) < 0;
};


/*
 * Return true if the value of this BigNumber is less than or equal to the
 * value of BigNumber(n, b), otherwise returns false.
 */
P['lessThanOrEqualTo'] = P['lte'] = P['le'] = function ( n, b ) {
    id = 7;
    return ( b = this['cmp']( n, b ) ) == -1 || b === 0;
};


/*
 *  n - 0 = n
 *  n - N = N
 *  n - I = -I
 *  0 - n = -n
 *  0 - 0 = 0
 *  0 - N = N
 *  0 - I = -I
 *  N - n = N
 *  N - 0 = N
 *  N - N = N
 *  N - I = N
 *  I - n = I
 *  I - 0 = I
 *  I - N = N
 *  I - I = N
 *
 * Return a new BigNumber whose value is the value of this BigNumber minus
 * the value of BigNumber(y, b).
 */
P['minus'] = P['sub'] = function ( y, b ) {
    var d, i, j, xLTy,
        x = this,
        a = x['s'];

    b = ( id = 8, y = new BigNumber( y, b ) )['s'];

    // Either NaN?
    if ( !a || !b ) {
        return new BigNumber(NaN);
    }

    // Signs differ?
    if ( a != b ) {
        return y['s'] = -b, x['plus'](y);
    }

    var xc = x['c'],
        xe = x['e'],
        yc = y['c'],
        ye = y['e'];

    if ( !xe || !ye ) {

        // Either Infinity?
        if ( !xc || !yc ) {
            return xc ? ( y['s'] = -b, y ) : new BigNumber( yc ? x : NaN );
        }

        // Either zero?
        if ( !xc[0] || !yc[0] ) {

            // y is non-zero?
            return yc[0]
              ? ( y['s'] = -b, y )

              // x is non-zero?
              : new BigNumber( xc[0]
                ? x

                // Both are zero.
                // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
                : ROUNDING_MODE == 3 ? -0 : 0 );
        }
    }

    // Determine which is the bigger number.
    // Prepend zeros to equalise exponents.
    if ( xc = xc.slice(), a = xe - ye ) {
        d = ( xLTy = a < 0 ) ? ( a = -a, xc ) : ( ye = xe, yc );

        for ( d.reverse(), b = a; b--; d.push(0) ) {
        }
        d.reverse();
    } else {

        // Exponents equal. Check digit by digit.
        j = ( ( xLTy = xc.length < yc.length ) ? xc : yc ).length;

        for ( a = b = 0; b < j; b++ ) {

            if ( xc[b] != yc[b] ) {
                xLTy = xc[b] < yc[b];
                break;
            }
        }
    }

    // x < y? Point xc to the array of the bigger number.
    if ( xLTy ) {
        d = xc, xc = yc, yc = d;
        y['s'] = -y['s'];
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter
     * as subtraction only needs to start at yc.length.
     */
    if ( ( b = -( ( j = xc.length ) - yc.length ) ) > 0 ) {

        for ( ; b--; xc[j++] = 0 ) {
        }
    }

    // Subtract yc from xc.
    for ( b = yc.length; b > a; ){

        if ( xc[--b] < yc[b] ) {

            for ( i = b; i && !xc[--i]; xc[i] = 9 ) {
            }
            --xc[i];
            xc[b] += 10;
        }
        xc[b] -= yc[b];
    }

    // Remove trailing zeros.
    for ( ; xc[--j] == 0; xc.pop() ) {
    }

    // Remove leading zeros and adjust exponent accordingly.
    for ( ; xc[0] == 0; xc.shift(), --ye ) {
    }

    /*
     * No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
     * when neither x or y are Infinity.
     */

    // Underflow?
    if ( ye < MIN_EXP || !xc[0] ) {

        /*
         * Following IEEE 754 (2008) 6.3,
         * n - n = +0  but  n - n = -0 when rounding towards -Infinity.
         */
        if ( !xc[0] ) {
            y['s'] = ROUNDING_MODE == 3 ? -1 : 1;
        }

        // Result is zero.
        xc = [ye = 0];
    }

    return y['c'] = xc, y['e'] = ye, y;
};


/*
 *   n % 0 =  N
 *   n % N =  N
 *   0 % n =  0
 *  -0 % n = -0
 *   0 % 0 =  N
 *   0 % N =  N
 *   N % n =  N
 *   N % 0 =  N
 *   N % N =  N
 *
 * Return a new BigNumber whose value is the value of this BigNumber modulo
 * the value of BigNumber(y, b).
 */
P['modulo'] = P['mod'] = function ( y, b ) {
    var x = this,
        xc = x['c'],
        yc = ( id = 9, y = new BigNumber( y, b ) )['c'],
        i = x['s'],
        j = y['s'];

    // Is x or y NaN, or y zero?
    b = !i || !j || yc && !yc[0];

    if ( b || xc && !xc[0] ) {
        return new BigNumber( b ? NaN : x );
    }

    x['s'] = y['s'] = 1;
    b = y['cmp'](x) == 1;
    x['s'] = i, y['s'] = j;

    return b
      ? new BigNumber(x)
      : ( i = DECIMAL_PLACES, j = ROUNDING_MODE,
        DECIMAL_PLACES = 0, ROUNDING_MODE = 1,
          x = x['div'](y),
            DECIMAL_PLACES = i, ROUNDING_MODE = j,
              this['minus']( x['times'](y) ) );
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * negated, i.e. multiplied by -1.
 */
P['negated'] = P['neg'] = function () {
    var x = new BigNumber(this);

    return x['s'] = -x['s'] || null, x;
};


/*
 *  n + 0 = n
 *  n + N = N
 *  n + I = I
 *  0 + n = n
 *  0 + 0 = 0
 *  0 + N = N
 *  0 + I = I
 *  N + n = N
 *  N + 0 = N
 *  N + N = N
 *  N + I = N
 *  I + n = I
 *  I + 0 = I
 *  I + N = N
 *  I + I = I
 *
 * Return a new BigNumber whose value is the value of this BigNumber plus
 * the value of BigNumber(y, b).
 */
P['plus'] = P['add'] = function ( y, b ) {
    var d,
        x = this,
        a = x['s'];

    b = ( id = 10, y = new BigNumber( y, b ) )['s'];

    // Either NaN?
    if ( !a || !b ) {
        return new BigNumber(NaN);
    }

    // Signs differ?
    if ( a != b ) {
        return y['s'] = -b, x['minus'](y);
    }

    var xe = x['e'],
        xc = x['c'],
        ye = y['e'],
        yc = y['c'];

    if ( !xe || !ye ) {

        // Either Infinity?
        if ( !xc || !yc ) {

            // Return +-Infinity.
            return new BigNumber( a / 0 );
        }

        // Either zero?
        if ( !xc[0] || !yc[0] ) {

            // y is non-zero?
            return yc[0]
              ? y

              // x is non-zero?
              : new BigNumber( xc[0]
                ? x

                // Both are zero. Return zero.
                : a * 0 );
        }
    }

    // Prepend zeros to equalise exponents.
    // Note: Faster to use reverse then do unshifts.
    if ( xc = xc.slice(), a = xe - ye ) {
        d = a > 0 ? ( ye = xe, yc ) : ( a = -a, xc );

        for ( d.reverse(); a--; d.push(0) ) {
        }
        d.reverse();
    }

    // Point xc to the longer array.
    if ( xc.length - yc.length < 0 ) {
        d = yc, yc = xc, xc = d;
    }

    /*
     * Only start adding at yc.length - 1 as the
     * further digits of xc can be left as they are.
     */
    for ( a = yc.length, b = 0; a;
         b = ( xc[--a] = xc[a] + yc[a] + b ) / 10 ^ 0, xc[a] %= 10 ) {
    }

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if ( b ) {
        xc.unshift(b);

        // Overflow? (MAX_EXP + 1 possible)
        if ( ++ye > MAX_EXP ) {

            // Infinity.
            xc = ye = null;
        }
    }

     // Remove trailing zeros.
    for ( a = xc.length; xc[--a] == 0; xc.pop() ) {
    }

    return y['c'] = xc, y['e'] = ye, y;
};


/*
 * Return a BigNumber whose value is the value of this BigNumber raised to
 * the power e. If e is negative round according to DECIMAL_PLACES and
 * ROUNDING_MODE.
 *
 * e {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P['toPower'] = P['pow'] = function ( e ) {

    // e to integer, avoiding NaN or Infinity becoming 0.
    var i = e * 0 == 0 ? e | 0 : e,
        x = new BigNumber(this),
        y = new BigNumber(ONE);

    // Use Math.pow?
    // Pass +-Infinity for out of range exponents.
    if ( ( ( ( outOfRange = e < -MAX_POWER || e > MAX_POWER ) &&
      (i = e * 1 / 0) ) ||

         /*
          * Any exponent that fails the parse becomes NaN.
          *
          * Include 'e !== 0' because on Opera -0 == parseFloat(-0) is false,
          * despite -0 === parseFloat(-0) && -0 == parseFloat('-0') is true.
          */
         parse(e) != e && e !== 0 && !(i = NaN) ) &&

          // 'pow() exponent not an integer: {e}'
          // 'pow() exponent out of range: {e}'
          !ifExceptionsThrow( e, 'exponent', 'pow' ) ||

            // Pass zero to Math.pow, as any value to the power zero is 1.
            !i ) {

        // i is +-Infinity, NaN or 0.
        return new BigNumber( Math.pow( x['toS'](), i ) );
    }

    for ( i = i < 0 ? -i : i; ; ) {

        if ( i & 1 ) {
            y = y['times'](x);
        }
        i >>= 1;

        if ( !i ) {
            break;
        }
        x = x['times'](x);
    }

    return e < 0 ? ONE['div'](y) : y;
};


/*
 * Return a BigNumber whose value is the value of this BigNumber raised to
 * the power m modulo n.
 *
 * m {BigNumber} the value to take the power of
 * n {BigNumber} the value to modulo by
 */
P['powm'] = function ( m, n ) {
    return this.pow(m).mod(n);
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a maximum of dp decimal places using rounding mode rm, or to
 * 0 and ROUNDING_MODE respectively if omitted.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 * [rm] {number} Integer, 0 to 8 inclusive.
 */
P['round'] = function ( dp, rm ) {

    dp = dp == null || ( ( ( outOfRange = dp < 0 || dp > MAX ) ||
      parse(dp) != dp ) &&

        // 'round() decimal places out of range: {dp}'
        // 'round() decimal places not an integer: {dp}'
        !ifExceptionsThrow( dp, 'decimal places', 'round' ) )
          ? 0
          : dp | 0;

    rm = rm == null || ( ( ( outOfRange = rm < 0 || rm > 8 ) ||

      // Include '&& rm !== 0' because with Opera -0 == parseFloat(-0) is false.
      parse(rm) != rm && rm !== 0 ) &&

        // 'round() mode not an integer: {rm}'
        // 'round() mode out of range: {rm}'
        !ifExceptionsThrow( rm, 'mode', 'round' ) )
          ? ROUNDING_MODE
          : rm | 0;

    return setMode( this, dp, rm );
};


/*
 *  sqrt(-n) =  N
 *  sqrt( N) =  N
 *  sqrt(-I) =  N
 *  sqrt( I) =  I
 *  sqrt( 0) =  0
 *  sqrt(-0) = -0
 *
 * Return a new BigNumber whose value is the square root of the value of
 * this BigNumber, rounded according to DECIMAL_PLACES and ROUNDING_MODE.
 */
P['squareRoot'] = P['sqrt'] = function () {
    var n, r, re, t,
        x = this,
        c = x['c'],
        s = x['s'],
        e = x['e'],
        dp = DECIMAL_PLACES,
        rm = ROUNDING_MODE,
        half = new BigNumber('0.5');

    // Negative/NaN/Infinity/zero?
    if ( s !== 1 || !c || !c[0] ) {

        return new BigNumber( !s || s < 0 && ( !c || c[0] )
          ? NaN
          : c ? x : 1 / 0 );
    }

    // Initial estimate.
    s = Math.sqrt( x['toS']() );
    ROUNDING_MODE = 1;

    /*
      Math.sqrt underflow/overflow?
      Pass x to Math.sqrt as integer, then adjust the exponent of the result.
     */
    if ( s == 0 || s == 1 / 0 ) {
        n = c.join('');

        if ( !( n.length + e & 1 ) ) {
            n += '0';
        }
        r = new BigNumber( Math.sqrt(n) + '' );

        // r may still not be finite.
        if ( !r['c'] ) {
            r['c'] = [1];
        }
        r['e'] = ( ( ( e + 1 ) / 2 ) | 0 ) - ( e < 0 || e & 1 );
    } else {
        r = new BigNumber( n = s.toString() );
    }
    re = r['e'];
    s = re + ( DECIMAL_PLACES += 4 );

    if ( s < 3 ) {
        s = 0;
    }
    e = s;

    // Newton-Raphson iteration.
    for ( ; ; ) {
        t = r;
        r = half['times']( t['plus']( x['div'](t) ) );

        if ( t['c'].slice( 0, s ).join('') === r['c'].slice( 0, s ).join('') ) {
            c = r['c'];

            /*
              The exponent of r may here be one less than the final result
              exponent (re), e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust
              s so the rounding digits are indexed correctly.
             */
            s = s - ( n && r['e'] < re );

            /*
              The 4th rounding digit may be in error by -1 so if the 4 rounding
              digits are 9999 or 4999 (i.e. approaching a rounding boundary)
              continue the iteration.
             */
            if ( c[s] == 9 && c[s - 1] == 9 && c[s - 2] == 9 &&
                    ( c[s - 3] == 9 || n && c[s - 3] == 4 ) ) {

                /*
                  If 9999 on first run through, check to see if rounding up
                  gives the exact result as the nines may infinitely repeat.
                 */
                if ( n && c[s - 3] == 9 ) {
                    t = r['round']( dp, 0 );

                    if ( t['times'](t)['eq'](x) ) {
                        ROUNDING_MODE = rm;
                        DECIMAL_PLACES = dp;

                        return t;
                    }
                }
                DECIMAL_PLACES += 4;
                s += 4;
                n = '';
            } else {

                /*
                  If the rounding digits are null, 0000 or 5000, check for an
                  exact result. If not, then there are further digits so
                  increment the 1st rounding digit to ensure correct rounding.
                 */
                if ( !c[e] && !c[e - 1] && !c[e - 2] &&
                        ( !c[e - 3] || c[e - 3] == 5 ) ) {

                    // Truncate to the first rounding digit.
                    if ( c.length > e - 2 ) {
                        c.length = e - 2;
                    }

                    if ( !r['times'](r)['eq'](x) ) {

                        while ( c.length < e - 3 ) {
                            c.push(0);
                        }
                        c[e - 3]++;
                    }
                }
                ROUNDING_MODE = rm;
                rnd( r, DECIMAL_PLACES = dp, 10 );

                return r;
            }
        }
    }
};


/*
 *  n * 0 = 0
 *  n * N = N
 *  n * I = I
 *  0 * n = 0
 *  0 * 0 = 0
 *  0 * N = N
 *  0 * I = N
 *  N * n = N
 *  N * 0 = N
 *  N * N = N
 *  N * I = N
 *  I * n = I
 *  I * 0 = N
 *  I * N = N
 *  I * I = I
 *
 * Return a new BigNumber whose value is the value of this BigNumber times
 * the value of BigNumber(y, b).
 */
P['times'] = P['mul'] = function ( y, b ) {
    var c,
        x = this,
        xc = x['c'],
        yc = ( id = 11, y = new BigNumber( y, b ) )['c'],
        i = x['e'],
        j = y['e'],
        a = x['s'];

    y['s'] = a == ( b = y['s'] ) ? 1 : -1;

    // Either NaN/Infinity/0?
    if ( !i && ( !xc || !xc[0] ) || !j && ( !yc || !yc[0] ) ) {

        // Either NaN?
        return new BigNumber( !a || !b ||

          // x is 0 and y is Infinity  or  y is 0 and x is Infinity?
          xc && !xc[0] && !yc || yc && !yc[0] && !xc

            // Return NaN.
            ? NaN

            // Either Infinity?
            : !xc || !yc

              // Return +-Infinity.
              ? y['s'] / 0

              // x or y is 0. Return +-0.
              : y['s'] * 0 );
    }
    y['e'] = i + j;

    if ( ( a = xc.length ) < ( b = yc.length ) ) {
        c = xc, xc = yc, yc = c, j = a, a = b, b = j;
    }

    for ( j = a + b, c = []; j--; c.push(0) ) {
    }

    // Multiply!
    for ( i = b - 1; i > -1; i-- ) {

        for ( b = 0, j = a + i;
              j > i;
              b = c[j] + yc[i] * xc[j - i - 1] + b,
              c[j--] = b % 10 | 0,
              b = b / 10 | 0 ) {
        }

        if ( b ) {
            c[j] = ( c[j] + b ) % 10;
        }
    }

    b && ++y['e'];

    // Remove any leading zero.
    !c[0] && c.shift();

    // Remove trailing zeros.
    for ( j = c.length; !c[--j]; c.pop() ) {
    }

    // No zero check needed as only x * 0 == 0 etc.

    // Overflow?
    y['c'] = y['e'] > MAX_EXP

      // Infinity.
      ? ( y['e'] = null )

      // Underflow?
      : y['e'] < MIN_EXP

        // Zero.
        ? [ y['e'] = 0 ]

        // Neither.
        : c;

    return y;
};

/*
 * Return a buffer containing the 
 */
P['toBuffer'] = function ( opts ) {

    if (typeof opts === 'string') {
        if (opts !== 'mpint') return 'Unsupported Buffer representation';

        var abs = this.abs();
        var buf = abs.toBuffer({ size : 1, endian : 'big' });
        var len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length;
        if (buf[0] & 0x80) len ++;

        var ret = new Buffer(4 + len);
        if (len > 0) buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0));
        if (buf[0] & 0x80) ret[4] = 0;

        ret[0] = len & (0xff << 24);
        ret[1] = len & (0xff << 16);
        ret[2] = len & (0xff << 8);
        ret[3] = len & (0xff << 0);

        // two's compliment for negative integers:
        var isNeg = this.lt(0);
        if (isNeg) {
            for (var i = 4; i < ret.length; i++) {
                ret[i] = 0xff - ret[i];
            }
        }
        ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0);
        if (isNeg) ret[ret.length - 1] ++;

        return ret;
    }

    if (!opts) opts = {};

    var endian = { 1 : 'big', '-1' : 'little' }[opts.endian]
        || opts.endian || 'big'
    ;

    var hex = this.toString(16);
    if (hex.charAt(0) === '-') throw new Error(
        'converting negative numbers to Buffers not supported yet'
    );

    var size = opts.size === 'auto' ? Math.ceil(hex.length / 2) : (opts.size || 1);

    var len = Math.ceil(hex.length / (2 * size)) * size;
    var buf = new Buffer(len);

    // zero-pad the hex string so the chunks are all `size` long
    while (hex.length < 2 * len) hex = '0' + hex;

    var hx = hex
        .split(new RegExp('(.{' + (2 * size) + '})'))
        .filter(function (s) { return s.length > 0 })
    ;

    hx.forEach(function (chunk, i) {
        for (var j = 0; j < size; j++) {
            var ix = i * size + (endian === 'big' ? j : size - j - 1);
            buf[ix] = parseInt(chunk.slice(j*2,j*2+2), 16);
        }
    });

    return buf;
};

/*
 * Return a string representing the value of this BigNumber in exponential
 * notation to dp fixed decimal places and rounded using ROUNDING_MODE if
 * necessary.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 */
P['toExponential'] = P['toE'] = function ( dp ) {

    return format( this,
      ( dp == null || ( ( outOfRange = dp < 0 || dp > MAX ) ||

        /*
         * Include '&& dp !== 0' because with Opera -0 == parseFloat(-0) is
         * false, despite -0 == parseFloat('-0') && 0 == -0 being true.
         */
        parse(dp) != dp && dp !== 0 ) &&

          // 'toE() decimal places not an integer: {dp}'
          // 'toE() decimal places out of range: {dp}'
          !ifExceptionsThrow( dp, 'decimal places', 'toE' ) ) && this['c']
            ? this['c'].length - 1
            : dp | 0, 1 );
};


/*
 * Return a string representing the value of this BigNumber in normal
 * notation to dp fixed decimal places and rounded using ROUNDING_MODE if
 * necessary.
 *
 * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
 * but e.g. (-0.00001).toFixed(0) is '-0'.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 */
P['toFixed'] = P['toF'] = function ( dp ) {
    var n, str, d,
        x = this;

    if ( !( dp == null || ( ( outOfRange = dp < 0 || dp > MAX ) ||
        parse(dp) != dp && dp !== 0 ) &&

        // 'toF() decimal places not an integer: {dp}'
        // 'toF() decimal places out of range: {dp}'
        !ifExceptionsThrow( dp, 'decimal places', 'toF' ) ) ) {
          d = x['e'] + ( dp | 0 );
    }

    n = TO_EXP_NEG, dp = TO_EXP_POS;
    TO_EXP_NEG = -( TO_EXP_POS = 1 / 0 );

    // Note: str is initially undefined.
    if ( d == str ) {
        str = x['toS']();
    } else {
        str = format( x, d );

        // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
        // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
        if ( x['s'] < 0 && x['c'] ) {

            // As e.g. -0 toFixed(3), will wrongly be returned as -0.000 from toString.
            if ( !x['c'][0] ) {
                str = str.replace(/^-/, '');

            // As e.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
            } else if ( str.indexOf('-') < 0 ) {
                str = '-' + str;
            }
        }
    }
    TO_EXP_NEG = n, TO_EXP_POS = dp;

    return str;
};


/*
 * Return a string array representing the value of this BigNumber as a
 * simple fraction with an integer numerator and an integer denominator.
 * The denominator will be a positive non-zero value less than or equal to
 * the specified maximum denominator. If a maximum denominator is not
 * specified, the denominator will be the lowest value necessary to
 * represent the number exactly.
 *
 * [maxD] {number|string|BigNumber} Integer >= 1 and < Infinity.
 */
P['toFraction'] = P['toFr'] = function ( maxD ) {
    var q, frac, n0, d0, d2, n, e,
        n1 = d0 = new BigNumber(ONE),
        d1 = n0 = new BigNumber('0'),
        x = this,
        xc = x['c'],
        exp = MAX_EXP,
        dp = DECIMAL_PLACES,
        rm = ROUNDING_MODE,
        d = new BigNumber(ONE);

    // NaN, Infinity.
    if ( !xc ) {
        return x['toS']();
    }

    e = d['e'] = xc.length - x['e'] - 1;

    // If max denominator is undefined or null...
    if ( maxD == null ||

         // or NaN...
         ( !( id = 12, n = new BigNumber(maxD) )['s'] ||

           // or less than 1, or Infinity...
           ( outOfRange = n['cmp'](n1) < 0 || !n['c'] ) ||

             // or not an integer...
             ( ERRORS && n['e'] < n['c'].length - 1 ) ) &&

               // 'toFr() max denominator not an integer: {maxD}'
               // 'toFr() max denominator out of range: {maxD}'
               !ifExceptionsThrow( maxD, 'max denominator', 'toFr' ) ||

                 // or greater than the maxD needed to specify the value exactly...
                 ( maxD = n )['cmp'](d) > 0 ) {

        // d is e.g. 10, 100, 1000, 10000... , n1 is 1.
        maxD = e > 0 ? d : n1;
    }

    MAX_EXP = 1 / 0;
    n = new BigNumber( xc.join('') );

    for ( DECIMAL_PLACES = 0, ROUNDING_MODE = 1; ; )  {
        q = n['div'](d);
        d2 = d0['plus']( q['times'](d1) );

        if ( d2['cmp'](maxD) == 1 ) {
            break;
        }

        d0 = d1, d1 = d2;

        n1 = n0['plus']( q['times']( d2 = n1 ) );
        n0 = d2;

        d = n['minus']( q['times']( d2 = d ) );
        n = d2;
    }

    d2 = maxD['minus'](d0)['div'](d1);
    n0 = n0['plus']( d2['times'](n1) );
    d0 = d0['plus']( d2['times'](d1) );

    n0['s'] = n1['s'] = x['s'];

    DECIMAL_PLACES = e * 2;
    ROUNDING_MODE = rm;

    // Determine which fraction is closer to x, n0 / d0 or n1 / d1?
    frac = n1['div'](d1)['minus'](x)['abs']()['cmp'](
      n0['div'](d0)['minus'](x)['abs']() ) < 1
      ? [ n1['toS'](), d1['toS']() ]
      : [ n0['toS'](), d0['toS']() ];

    return MAX_EXP = exp, DECIMAL_PLACES = dp, frac;
};


/*
 * Return a string representing the value of this BigNumber to sd significant
 * digits and rounded using ROUNDING_MODE if necessary.
 * If sd is less than the number of digits necessary to represent the integer
 * part of the value in normal notation, then use exponential notation.
 *
 * sd {number} Integer, 1 to MAX inclusive.
 */
P['toPrecision'] = P['toP'] = function ( sd ) {

    /*
     * ERRORS true: Throw if sd not undefined, null or an integer in range.
     * ERRORS false: Ignore sd if not a number or not in range.
     * Truncate non-integers.
     */
    return sd == null || ( ( ( outOfRange = sd < 1 || sd > MAX ) ||
      parse(sd) != sd ) &&

        // 'toP() precision not an integer: {sd}'
        // 'toP() precision out of range: {sd}'
        !ifExceptionsThrow( sd, 'precision', 'toP' ) )
          ? this['toS']()
          : format( this, --sd | 0, 2 );
};


/*
 * Return a string representing the value of this BigNumber in base b, or
 * base 10 if b is omitted. If a base is specified, including base 10,
 * round according to DECIMAL_PLACES and ROUNDING_MODE.
 * If a base is not specified, and this BigNumber has a positive exponent
 * that is equal to or greater than TO_EXP_POS, or a negative exponent equal
 * to or less than TO_EXP_NEG, return exponential notation.
 *
 * [b] {number} Integer, 2 to 64 inclusive.
 */
P['toString'] = P['toS'] = function ( b ) {
    var u, str, strL,
        x = this,
        xe = x['e'];

    // Infinity or NaN?
    if ( xe === null ) {
        str = x['s'] ? 'Infinity' : 'NaN';

    // Exponential format?
    } else if ( b === u && ( xe <= TO_EXP_NEG || xe >= TO_EXP_POS ) ) {
        return format( x, x['c'].length - 1, 1 );
    } else {
        str = x['c'].join('');

        // Negative exponent?
        if ( xe < 0 ) {

            // Prepend zeros.
            for ( ; ++xe; str = '0' + str ) {
            }
            str = '0.' + str;

        // Positive exponent?
        } else if ( strL = str.length, xe > 0 ) {

            if ( ++xe > strL ) {

                // Append zeros.
                for ( xe -= strL; xe-- ; str += '0' ) {
                }
            } else if ( xe < strL ) {
                str = str.slice( 0, xe ) + '.' + str.slice(xe);
            }

        // Exponent zero.
        } else {
            if ( u = str.charAt(0), strL > 1 ) {
                str = u + '.' + str.slice(1);

            // Avoid '-0'
            } else if ( u == '0' ) {
                return u;
            }
        }

        if ( b != null ) {

            if ( !( outOfRange = !( b >= 2 && b < 65 ) ) &&
              ( b == (b | 0) || !ERRORS ) ) {
                str = convert( str, b | 0, 10, x['s'] );

                // Avoid '-0'
                if ( str == '0' ) {
                    return str;
                }
            } else {

                // 'toS() base not an integer: {b}'
                // 'toS() base out of range: {b}'
                ifExceptionsThrow( b, 'base', 'toS' );
            }
        }

    }

    return x['s'] < 0 ? '-' + str : str;
};


/*
 * Return as toString, but do not accept a base argument.
 */
P['valueOf'] = function () {
    return this['toS']();
};


// Add aliases for BigDecimal methods.
//P['add'] = P['plus'];
//P['subtract'] = P['minus'];
//P['multiply'] = P['times'];
//P['divide'] = P['div'];
//P['remainder'] = P['mod'];
//P['compareTo'] = P['cmp'];
//P['negate'] = P['neg'];


// EXPORT
module.exports = BigNumber;

}).call(this,require("buffer").Buffer)
},{"buffer":3}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
/**
 * A JavaScript implementation of the SHA family of hashes, as defined in FIPS PUB 180-4 and FIPS PUB 202, as
 * well as the corresponding HMAC implementation as defined in FIPS PUB 198a
 *
 * Copyright 2008-2020 Brian Turek, 1998-2009 Paul Johnston & Contributors
 * Distributed under the BSD License
 * See http://caligatio.github.com/jsSHA/ for more information
 *
 * Two ECMAScript polyfill functions carry the following license:
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED,
 * INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 * MERCHANTABLITY OR NON-INFRINGEMENT.
 *
 * See the Apache Version 2.0 License for specific language governing permissions and limitations under the License.
 */
!function(t,r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r():"function"==typeof define&&define.amd?define(r):(t=t||self).jsSHA=r()}(this,(function(){"use strict";var t=function(r,n){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,r){t.__proto__=r}||function(t,r){for(var n in r)r.hasOwnProperty(n)&&(t[n]=r[n])})(r,n)};var r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function n(t,r,n,i){var e,o,u,s=r||[0],f=(n=n||0)>>>3,h=-1===i?3:0;for(e=0;e<t.length;e+=1)o=(u=e+f)>>>2,s.length<=o&&s.push(0),s[o]|=t[e]<<8*(h+i*(u%4));return{value:s,binLen:8*t.length+n}}function i(t,i,e){switch(i){case"UTF8":case"UTF16BE":case"UTF16LE":break;default:throw new Error("encoding must be UTF8, UTF16BE, or UTF16LE")}switch(t){case"HEX":return function(t,r,n){return function(t,r,n,i){var e,o,u,s;if(0!=t.length%2)throw new Error("String of HEX type must be in byte increments");var f=r||[0],h=(n=n||0)>>>3,a=-1===i?3:0;for(e=0;e<t.length;e+=2){if(o=parseInt(t.substr(e,2),16),isNaN(o))throw new Error("String of HEX type contains invalid characters");for(u=(s=(e>>>1)+h)>>>2;f.length<=u;)f.push(0);f[u]|=o<<8*(a+i*(s%4))}return{value:f,binLen:4*t.length+n}}(t,r,n,e)};case"TEXT":return function(t,r,n){return function(t,r,n,i,e){var o,u,s,f,h,a,c,w,v=0,E=n||[0],A=(i=i||0)>>>3;if("UTF8"===r)for(c=-1===e?3:0,s=0;s<t.length;s+=1)for(u=[],128>(o=t.charCodeAt(s))?u.push(o):2048>o?(u.push(192|o>>>6),u.push(128|63&o)):55296>o||57344<=o?u.push(224|o>>>12,128|o>>>6&63,128|63&o):(s+=1,o=65536+((1023&o)<<10|1023&t.charCodeAt(s)),u.push(240|o>>>18,128|o>>>12&63,128|o>>>6&63,128|63&o)),f=0;f<u.length;f+=1){for(h=(a=v+A)>>>2;E.length<=h;)E.push(0);E[h]|=u[f]<<8*(c+e*(a%4)),v+=1}else for(c=-1===e?2:0,w="UTF16LE"===r&&1!==e||"UTF16LE"!==r&&1===e,s=0;s<t.length;s+=1){for(o=t.charCodeAt(s),!0===w&&(o=(f=255&o)<<8|o>>>8),h=(a=v+A)>>>2;E.length<=h;)E.push(0);E[h]|=o<<8*(c+e*(a%4)),v+=2}return{value:E,binLen:8*v+i}}(t,i,r,n,e)};case"B64":return function(t,n,i){return function(t,n,i,e){var o,u,s,f,h,a,c=0,w=n||[0],v=(i=i||0)>>>3,E=-1===e?3:0,A=t.indexOf("=");if(-1===t.search(/^[a-zA-Z0-9=+/]+$/))throw new Error("Invalid character in base-64 string");if(t=t.replace(/=/g,""),-1!==A&&A<t.length)throw new Error("Invalid '=' found in base-64 string");for(o=0;o<t.length;o+=4){for(f=t.substr(o,4),s=0,u=0;u<f.length;u+=1)s|=r.indexOf(f.charAt(u))<<18-6*u;for(u=0;u<f.length-1;u+=1){for(h=(a=c+v)>>>2;w.length<=h;)w.push(0);w[h]|=(s>>>16-8*u&255)<<8*(E+e*(a%4)),c+=1}}return{value:w,binLen:8*c+i}}(t,n,i,e)};case"BYTES":return function(t,r,n){return function(t,r,n,i){var e,o,u,s,f=r||[0],h=(n=n||0)>>>3,a=-1===i?3:0;for(o=0;o<t.length;o+=1)e=t.charCodeAt(o),u=(s=o+h)>>>2,f.length<=u&&f.push(0),f[u]|=e<<8*(a+i*(s%4));return{value:f,binLen:8*t.length+n}}(t,r,n,e)};case"ARRAYBUFFER":try{new ArrayBuffer(0)}catch(t){throw new Error("ARRAYBUFFER not supported by this environment")}return function(t,r,i){return function(t,r,i,e){return n(new Uint8Array(t),r,i,e)}(t,r,i,e)};case"UINT8ARRAY":try{new Uint8Array(0)}catch(t){throw new Error("UINT8ARRAY not supported by this environment")}return function(t,r,i){return n(t,r,i,e)};default:throw new Error("format must be HEX, TEXT, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY")}}function e(t,n,i,e){switch(t){case"HEX":return function(t){return function(t,r,n,i){var e,o,u="",s=r/8,f=-1===n?3:0;for(e=0;e<s;e+=1)o=t[e>>>2]>>>8*(f+n*(e%4)),u+="0123456789abcdef".charAt(o>>>4&15)+"0123456789abcdef".charAt(15&o);return i.outputUpper?u.toUpperCase():u}(t,n,i,e)};case"B64":return function(t){return function(t,n,i,e){var o,u,s,f,h,a="",c=n/8,w=-1===i?3:0;for(o=0;o<c;o+=3)for(f=o+1<c?t[o+1>>>2]:0,h=o+2<c?t[o+2>>>2]:0,s=(t[o>>>2]>>>8*(w+i*(o%4))&255)<<16|(f>>>8*(w+i*((o+1)%4))&255)<<8|h>>>8*(w+i*((o+2)%4))&255,u=0;u<4;u+=1)a+=8*o+6*u<=n?r.charAt(s>>>6*(3-u)&63):e.b64Pad;return a}(t,n,i,e)};case"BYTES":return function(t){return function(t,r,n){var i,e,o="",u=r/8,s=-1===n?3:0;for(i=0;i<u;i+=1)e=t[i>>>2]>>>8*(s+n*(i%4))&255,o+=String.fromCharCode(e);return o}(t,n,i)};case"ARRAYBUFFER":try{new ArrayBuffer(0)}catch(t){throw new Error("ARRAYBUFFER not supported by this environment")}return function(t){return function(t,r,n){var i,e=r/8,o=new ArrayBuffer(e),u=new Uint8Array(o),s=-1===n?3:0;for(i=0;i<e;i+=1)u[i]=t[i>>>2]>>>8*(s+n*(i%4))&255;return o}(t,n,i)};case"UINT8ARRAY":try{new Uint8Array(0)}catch(t){throw new Error("UINT8ARRAY not supported by this environment")}return function(t){return function(t,r,n){var i,e=r/8,o=-1===n?3:0,u=new Uint8Array(e);for(i=0;i<e;i+=1)u[i]=t[i>>>2]>>>8*(o+n*(i%4))&255;return u}(t,n,i)};default:throw new Error("format must be HEX, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY")}}var o=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],u=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],s=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];function f(t){var r={outputUpper:!1,b64Pad:"=",outputLen:-1},n=t||{},i="Output length must be a multiple of 8";if(r.outputUpper=n.outputUpper||!1,n.b64Pad&&(r.b64Pad=n.b64Pad),n.outputLen){if(n.outputLen%8!=0)throw new Error(i);r.outputLen=n.outputLen}else if(n.shakeLen){if(n.shakeLen%8!=0)throw new Error(i);r.outputLen=n.shakeLen}if("boolean"!=typeof r.outputUpper)throw new Error("Invalid outputUpper formatting option");if("string"!=typeof r.b64Pad)throw new Error("Invalid b64Pad formatting option");return r}function h(t,r){return t>>>r|t<<32-r}function a(t,r){return t>>>r}function c(t,r,n){return t&r^~t&n}function w(t,r,n){return t&r^t&n^r&n}function v(t){return h(t,2)^h(t,13)^h(t,22)}function E(t,r){var n=(65535&t)+(65535&r);return(65535&(t>>>16)+(r>>>16)+(n>>>16))<<16|65535&n}function A(t,r,n,i){var e=(65535&t)+(65535&r)+(65535&n)+(65535&i);return(65535&(t>>>16)+(r>>>16)+(n>>>16)+(i>>>16)+(e>>>16))<<16|65535&e}function p(t,r,n,i,e){var o=(65535&t)+(65535&r)+(65535&n)+(65535&i)+(65535&e);return(65535&(t>>>16)+(r>>>16)+(n>>>16)+(i>>>16)+(e>>>16)+(o>>>16))<<16|65535&o}function d(t){return h(t,7)^h(t,18)^a(t,3)}function l(t){return h(t,6)^h(t,11)^h(t,25)}function R(t){return"SHA-224"==t?u.slice():s.slice()}function U(t,r){var n,i,e,u,s,f,R,U,y,b,T,m,F=[];for(n=r[0],i=r[1],e=r[2],u=r[3],s=r[4],f=r[5],R=r[6],U=r[7],T=0;T<64;T+=1)F[T]=T<16?t[T]:A(h(m=F[T-2],17)^h(m,19)^a(m,10),F[T-7],d(F[T-15]),F[T-16]),y=p(U,l(s),c(s,f,R),o[T],F[T]),b=E(v(n),w(n,i,e)),U=R,R=f,f=s,s=E(u,y),u=e,e=i,i=n,n=E(y,b);return r[0]=E(n,r[0]),r[1]=E(i,r[1]),r[2]=E(e,r[2]),r[3]=E(u,r[3]),r[4]=E(s,r[4]),r[5]=E(f,r[5]),r[6]=E(R,r[6]),r[7]=E(U,r[7]),r}return function(r){function n(t,n,e){var o=this;if(!1==("SHA-224"===t||"SHA-256"===t))throw new Error("Chosen SHA variant is not supported");var u=e||{};return(o=r.call(this,t,n,e)||this).t=o.i,o.o=!0,o.u=-1,o.s=i(o.h,o.v,o.u),o.A=U,o.p=function(t){return t.slice()},o.l=R,o.R=function(r,n,i,e){return function(t,r,n,i,e){for(var o,u=15+(r+65>>>9<<4),s=r+n;t.length<=u;)t.push(0);for(t[r>>>5]|=128<<24-r%32,t[u]=4294967295&s,t[u-1]=s/4294967296|0,o=0;o<t.length;o+=16)i=U(t.slice(o,o+16),i);return"SHA-224"===e?[i[0],i[1],i[2],i[3],i[4],i[5],i[6]]:i}(r,n,i,e,t)},o.U=R(t),o.T=512,o.m="SHA-224"===t?224:256,o.F=!1,u.hmacKey&&o.B(function(t,r,n,e){var o=t+" must include a value and format";if(!r){if(!e)throw new Error(o);return e}if(void 0===r.value||!r.format)throw new Error(o);return i(r.format,r.encoding||"UTF8",n)(r.value)}("hmacKey",u.hmacKey,o.u)),o}return function(r,n){function i(){this.constructor=r}t(r,n),r.prototype=null===n?Object.create(n):(i.prototype=n.prototype,new i)}(n,r),n}(function(){function t(t,r,n){var i=n||{};if(this.h=r,this.v=i.encoding||"UTF8",this.numRounds=i.numRounds||1,isNaN(this.numRounds)||this.numRounds!==parseInt(this.numRounds,10)||1>this.numRounds)throw new Error("numRounds must a integer >= 1");this.g=t,this.Y=[],this.H=0,this.S=!1,this.I=0,this.C=!1,this.L=[],this.N=[]}return t.prototype.update=function(t){var r,n=0,i=this.T>>>5,e=this.s(t,this.Y,this.H),o=e.binLen,u=e.value,s=o>>>5;for(r=0;r<s;r+=i)n+this.T<=o&&(this.U=this.A(u.slice(r,r+i),this.U),n+=this.T);this.I+=n,this.Y=u.slice(n>>>5),this.H=o%this.T,this.S=!0},t.prototype.getHash=function(t,r){var n,i,o=this.m,u=f(r);if(!0===this.F){if(-1===u.outputLen)throw new Error("Output length must be specified in options");o=u.outputLen}var s=e(t,o,this.u,u);if(!0===this.C&&this.t)return s(this.t(u));for(i=this.R(this.Y.slice(),this.H,this.I,this.p(this.U),o),n=1;n<this.numRounds;n+=1)!0===this.F&&o%32!=0&&(i[i.length-1]&=16777215>>>24-o%32),i=this.R(i,o,0,this.l(this.g),o);return s(i)},t.prototype.setHMACKey=function(t,r,n){if(!0!==this.o)throw new Error("Variant does not support HMAC");if(!0===this.S)throw new Error("Cannot set MAC key after calling update");var e=i(r,(n||{}).encoding||"UTF8",this.u);this.B(e(t))},t.prototype.B=function(t){var r,n=this.T>>>3,i=n/4-1;if(1!==this.numRounds)throw new Error("Cannot set numRounds with MAC");if(!0===this.C)throw new Error("MAC key already set");for(n<t.binLen/8&&(t.value=this.R(t.value,t.binLen,0,this.l(this.g),this.m));t.value.length<=i;)t.value.push(0);for(r=0;r<=i;r+=1)this.L[r]=909522486^t.value[r],this.N[r]=1549556828^t.value[r];this.U=this.A(this.L,this.U),this.I=this.T,this.C=!0},t.prototype.getHMAC=function(t,r){var n=f(r);return e(t,this.m,this.u,n)(this.i())},t.prototype.i=function(){var t;if(!1===this.C)throw new Error("Cannot call getHMAC without first setting MAC key");var r=this.R(this.Y.slice(),this.H,this.I,this.p(this.U),this.m);return t=this.A(this.N,this.l(this.g)),t=this.R(r,this.m,this.T,t,this.m)},t}())}));

},{}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],8:[function(require,module,exports){
var cryptoUtils = require('./crypto/utils');
var bech32 = require('./crypto/bech32');
var BTCValidator = require('./bitcoin_validator');

function validateAddress(address, currency, networkType) {
    var prefix = 'bitcoincash';
    var regexp = new RegExp(currency.regexp);
    var raw_address;

    var res = address.split(':');
    if (res.length === 1) {
        raw_address = address
    } else {
        if (res[0] !== 'bitcoincash') {
            return false;
        }
        raw_address = res[1];
    }

    if (!regexp.test(raw_address)) {
        return false;
    }

    if (raw_address.toLowerCase() != raw_address && raw_address.toUpperCase() != raw_address) {
        return false;
    }

    var decoded = cryptoUtils.base32.b32decode(raw_address);
    if (networkType === 'testnet') {
        prefix = 'bchtest';
    }

    try {
        if (bech32.verifyChecksum(prefix, decoded)) {
            return false;    
        }
    } catch(e) {
        return false;
    }
    return true;
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return validateAddress(address, currency, networkType) || BTCValidator.isValidAddress(address, currency, networkType);
    }
}
},{"./bitcoin_validator":9,"./crypto/bech32":12,"./crypto/utils":17}],9:[function(require,module,exports){
(function (Buffer){
var base58 = require('./crypto/base58');
var segwit = require('./crypto/segwit_addr');
var cryptoUtils = require('./crypto/utils');

var DEFAULT_NETWORK_TYPE = 'prod';

function getDecoded(address) {
    try {
        return base58.decode(address);
    } catch (e) {
        // if decoding fails, assume invalid address
        return null;
    }
}

function getChecksum(hashFunction, payload) {
    // Each currency may implement different hashing algorithm
    switch (hashFunction) {
        // blake then keccak hash chain
        case 'blake256keccak256':
            var blake = cryptoUtils.blake2b256(payload);
            return cryptoUtils.keccak256Checksum(Buffer.from(blake, 'hex'));
        case 'blake256':
            return cryptoUtils.blake256Checksum(payload);
        case 'keccak256':
            return cryptoUtils.keccak256Checksum(payload);
        case 'sha256':
        default:
            return cryptoUtils.sha256Checksum(payload);
    }
}

function getAddressType(address, currency) {
    currency = currency || {};
    // should be 25 bytes per btc address spec and 26 decred
    var expectedLength = currency.expectedLength || 25;
    var hashFunction = currency.hashFunction || 'sha256';
    var decoded = getDecoded(address);

    if (decoded) {
        var length = decoded.length;

        if (length !== expectedLength) {
            return null;
        }

        if(currency.regex) {
            if(!currency.regex.test(address)) {
                return false;
            }
        }

        var checksum = cryptoUtils.toHex(decoded.slice(length - 4, length)),
            body = cryptoUtils.toHex(decoded.slice(0, length - 4)),
            goodChecksum = getChecksum(hashFunction, body);

        return checksum === goodChecksum ? cryptoUtils.toHex(decoded.slice(0, expectedLength - 24)) : null;
    }

    return null;
}

function isValidP2PKHandP2SHAddress(address, currency, networkType) {
    networkType = networkType || DEFAULT_NETWORK_TYPE;

    var correctAddressTypes;
    var addressType = getAddressType(address, currency);

    if (addressType) {
        if (networkType === 'prod' || networkType === 'testnet') {
            correctAddressTypes = currency.addressTypes[networkType]
        } else {
            correctAddressTypes = currency.addressTypes.prod.concat(currency.addressTypes.testnet);
        }

        return correctAddressTypes.indexOf(addressType) >= 0;
    }

    return false;
}

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return isValidP2PKHandP2SHAddress(address, currency, networkType) || segwit.isValidAddress(address);
    }
};

}).call(this,require("buffer").Buffer)
},{"./crypto/base58":11,"./crypto/segwit_addr":15,"./crypto/utils":17,"buffer":3}],10:[function(require,module,exports){
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

 /**
* Encode a string to base32
*/
var b32encode = function(s) {
    var parts = [];
    var quanta = Math.floor((s.length / 5));
    var leftover = s.length % 5;

     if (leftover != 0) {
        for (var i = 0; i < (5 - leftover); i++) {
            s += '\x00';
        }
        quanta += 1;
    }

     for (var i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x3F) >> 1)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0F) << 1) | (s.charCodeAt(i * 5 + 3) >> 7)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x7F) >> 2)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 4) & 0x1F))));
    }

     var replace = 0;
    if (leftover == 1) replace = 6;
    else if (leftover == 2) replace = 4;
    else if (leftover == 3) replace = 3;
    else if (leftover == 4) replace = 1;

     for (var i = 0; i < replace; i++) parts.pop();
    for (var i = 0; i < replace; i++) parts.push("=");

     return parts.join("");
}

/**
* Decode a base32 string.
* This is made specifically for our use, deals only with proper strings
*/
var b32decode = function(s) {
    var r = new ArrayBuffer(s.length * 5 / 8);
    var b = new Uint8Array(r);
    for (var j = 0; j < s.length / 8; j++) {
        var v = [0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < 8; ++i) {
            v[i] = alphabet.indexOf(s[j * 8 + i]);
        }
        var i = 0;
        b[j * 5 + 0] = (v[i + 0] << 3) | (v[i + 1] >> 2);
        b[j * 5 + 1] = ((v[i + 1] & 0x3) << 6) | (v[i + 2] << 1) | (v[i + 3] >> 4);
        b[j * 5 + 2] = ((v[i + 3] & 0xf) << 4) | (v[i + 4] >> 1);
        b[j * 5 + 3] = ((v[i + 4] & 0x1) << 7) | (v[i + 5] << 2) | (v[i + 6] >> 3);
        b[j * 5 + 4] = ((v[i + 6] & 0x7) << 5) | (v[i + 7]);
    }
    return b;
}

module.exports = {
    b32decode: b32decode,
    b32encode: b32encode
};
},{}],11:[function(require,module,exports){
// Base58 encoding/decoding
// Originally written by Mike Hearn for BitcoinJ
// Copyright (c) 2011 Google Inc
// Ported to JavaScript by Stefan Thomas
// Merged Buffer refactorings from base58-native by Stephen Pair
// Copyright (c) 2013 BitPay Inc

var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var ALPHABET_MAP = {};
for (var i = 0; i < ALPHABET.length; ++i) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}
var BASE = ALPHABET.length;

module.exports = {
    decode: function(string) {
        if (string.length === 0) return [];

        var i, j, bytes = [0];
        for (i = 0; i < string.length; ++i) {
            var c = string[i];
            if (!(c in ALPHABET_MAP)) throw new Error('Non-base58 character');

            for (j = 0; j < bytes.length; ++j) bytes[j] *= BASE
            bytes[0] += ALPHABET_MAP[c];

            var carry = 0;
            for (j = 0; j < bytes.length; ++j) {
                bytes[j] += carry;
                carry = bytes[j] >> 8;
                bytes[j] &= 0xff
            }

            while (carry) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        // deal with leading zeros
        for (i = 0; string[i] === '1' && i < string.length - 1; ++i){
            bytes.push(0);
        }

        return bytes.reverse();
    }
};

},{}],12:[function(require,module,exports){
// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
var GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

module.exports = {
  decode: decode,
  encode: encode,
  verifyChecksum: verifyChecksum
};


function polymod (values) {
  var chk = 1;
  for (var p = 0; p < values.length; ++p) {
    var top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ values[p];
    for (var i = 0; i < 5; ++i) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function hrpExpand (hrp) {
  var ret = [];
  var p;
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return ret;
}

function verifyChecksum (hrp, data) {
  return polymod(hrpExpand(hrp).concat(data)) === 1;
}

function createChecksum (hrp, data) {
  var values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  var mod = polymod(values) ^ 1;
  var ret = [];
  for (var p = 0; p < 6; ++p) {
    ret.push((mod >> 5 * (5 - p)) & 31);
  }
  return ret;
}

function encode (hrp, data) {
  var combined = data.concat(createChecksum(hrp, data));
  var ret = hrp + '1';
  for (var p = 0; p < combined.length; ++p) {
    ret += CHARSET.charAt(combined[p]);
  }
  return ret;
}

function decode (bechString) {
  var p;
  var has_lower = false;
  var has_upper = false;
  for (p = 0; p < bechString.length; ++p) {
    if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
      return null;
    }
    if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
        has_lower = true;
    }
    if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
        has_upper = true;
    }
  }
  if (has_lower && has_upper) {
    return null;
  }
  bechString = bechString.toLowerCase();
  var pos = bechString.lastIndexOf('1');
  if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
    return null;
  }
  var hrp = bechString.substring(0, pos);
  var data = [];
  for (p = pos + 1; p < bechString.length; ++p) {
    var d = CHARSET.indexOf(bechString.charAt(p));
    if (d === -1) {
      return null;
    }
    data.push(d);
  }
  if (!verifyChecksum(hrp, data)) {
    return null;
  }
  return {hrp: hrp, data: data.slice(0, data.length - 6)};
}

},{}],13:[function(require,module,exports){
"use strict";
var Buffer = require("safe-buffer").Buffer;
/**
 * Credits to https://github.com/cryptocoinjs/blake-hash
 */
Blake256.sigma = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
];

Blake256.u256 = [
    0x243f6a88,
    0x85a308d3,
    0x13198a2e,
    0x03707344,
    0xa4093822,
    0x299f31d0,
    0x082efa98,
    0xec4e6c89,
    0x452821e6,
    0x38d01377,
    0xbe5466cf,
    0x34e90c6c,
    0xc0ac29b7,
    0xc97c50dd,
    0x3f84d5b5,
    0xb5470917,
];

Blake256.padding = new Buffer([
    0x80,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
]);

Blake256.prototype._length_carry = function (arr) {
    for (var j = 0; j < arr.length; ++j) {
        if (arr[j] < 0x0100000000) break;
        arr[j] -= 0x0100000000;
        arr[j + 1] += 1;
    }
};

Blake256.prototype.update = function (data, encoding) {
    data = new Buffer(data, encoding);
    var block = this._block;
    var offset = 0;

    while (this._blockOffset + data.length - offset >= block.length) {
        for (var i = this._blockOffset; i < block.length; )
            block[i++] = data[offset++];

        this._length[0] += block.length * 8;
        this._length_carry(this._length);

        this._compress();
        this._blockOffset = 0;
    }

    while (offset < data.length) block[this._blockOffset++] = data[offset++];
    return this;
};

var zo = new Buffer([0x01]);
var oo = new Buffer([0x81]);

function rot(x, n) {
    return ((x << (32 - n)) | (x >>> n)) >>> 0;
}

function g(v, m, i, a, b, c, d, e) {
    var sigma = Blake256.sigma;
    var u256 = Blake256.u256;

    v[a] =
        (v[a] + ((m[sigma[i][e]] ^ u256[sigma[i][e + 1]]) >>> 0) + v[b]) >>> 0;
    v[d] = rot(v[d] ^ v[a], 16);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = rot(v[b] ^ v[c], 12);
    v[a] =
        (v[a] + ((m[sigma[i][e + 1]] ^ u256[sigma[i][e]]) >>> 0) + v[b]) >>> 0;
    v[d] = rot(v[d] ^ v[a], 8);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = rot(v[b] ^ v[c], 7);
}

function Blake256() {
    this._h = [
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
    ];

    this._s = [0, 0, 0, 0];

    this._block = new Buffer(64);
    this._blockOffset = 0;
    this._length = [0, 0];

    this._nullt = false;

    this._zo = zo;
    this._oo = oo;
}

Blake256.prototype._compress = function () {
    var u256 = Blake256.u256;
    var v = new Array(16);
    var m = new Array(16);
    var i;

    for (i = 0; i < 16; ++i) m[i] = this._block.readUInt32BE(i * 4);
    for (i = 0; i < 8; ++i) v[i] = this._h[i] >>> 0;
    for (i = 8; i < 12; ++i) v[i] = (this._s[i - 8] ^ u256[i - 8]) >>> 0;
    for (i = 12; i < 16; ++i) v[i] = u256[i - 8];

    if (!this._nullt) {
        v[12] = (v[12] ^ this._length[0]) >>> 0;
        v[13] = (v[13] ^ this._length[0]) >>> 0;
        v[14] = (v[14] ^ this._length[1]) >>> 0;
        v[15] = (v[15] ^ this._length[1]) >>> 0;
    }

    for (i = 0; i < 14; ++i) {
        /* column step */
        g(v, m, i, 0, 4, 8, 12, 0);
        g(v, m, i, 1, 5, 9, 13, 2);
        g(v, m, i, 2, 6, 10, 14, 4);
        g(v, m, i, 3, 7, 11, 15, 6);
        /* diagonal step */
        g(v, m, i, 0, 5, 10, 15, 8);
        g(v, m, i, 1, 6, 11, 12, 10);
        g(v, m, i, 2, 7, 8, 13, 12);
        g(v, m, i, 3, 4, 9, 14, 14);
    }

    for (i = 0; i < 16; ++i) this._h[i % 8] = (this._h[i % 8] ^ v[i]) >>> 0;
    for (i = 0; i < 8; ++i) this._h[i] = (this._h[i] ^ this._s[i % 4]) >>> 0;
};

Blake256.prototype._padding = function () {
    var lo = this._length[0] + this._blockOffset * 8;
    var hi = this._length[1];
    if (lo >= 0x0100000000) {
        lo -= 0x0100000000;
        hi += 1;
    }

    var msglen = new Buffer(8);
    msglen.writeUInt32BE(hi, 0);
    msglen.writeUInt32BE(lo, 4);

    if (this._blockOffset === 55) {
        this._length[0] -= 8;
        this.update(this._oo);
    } else {
        if (this._blockOffset < 55) {
            if (this._blockOffset === 0) this._nullt = true;
            this._length[0] -= (55 - this._blockOffset) * 8;
            this.update(Blake256.padding.slice(0, 55 - this._blockOffset));
        } else {
            this._length[0] -= (64 - this._blockOffset) * 8;
            this.update(Blake256.padding.slice(0, 64 - this._blockOffset));
            this._length[0] -= 55 * 8;
            this.update(Blake256.padding.slice(1, 1 + 55));
            this._nullt = true;
        }

        this.update(this._zo);
        this._length[0] -= 8;
    }

    this._length[0] -= 64;
    this.update(msglen);
};

Blake256.prototype.digest = function (encoding) {
    this._padding();

    var buffer = new Buffer(32);
    for (var i = 0; i < 8; ++i) buffer.writeUInt32BE(this._h[i], i * 4);
    return buffer.toString(encoding);
};

module.exports = Blake256;

},{"safe-buffer":7}],14:[function(require,module,exports){
'use strict';

/**
 * Credits to https://github.com/emilbayes/blake2b
 *
 * Copyright (c) 2017, Emil Bay github@tixz.dk
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
function ADD64AA (v, a, b) {
  var o0 = v[a] + v[b]
  var o1 = v[a + 1] + v[b + 1]
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC (v, a, b0, b1) {
  var o0 = v[a] + b0
  if (b0 < 0) {
    o0 += 0x100000000
  }
  var o1 = v[a + 1] + b1
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// Little-endian byte access
function B2B_GET32 (arr, i) {
  return (arr[i] ^
  (arr[i + 1] << 8) ^
  (arr[i + 2] << 16) ^
  (arr[i + 3] << 24))
}

// G Mixing function
// The ROTRs are inlined for speed
function B2B_G (a, b, c, d, ix, iy) {
  var x0 = m[ix]
  var x1 = m[ix + 1]
  var y0 = m[iy]
  var y1 = m[iy + 1]

  ADD64AA(v, a, b) // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  ADD64AC(v, a, x0, x1) // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  var xor0 = v[d] ^ v[a]
  var xor1 = v[d + 1] ^ v[a + 1]
  v[d] = xor1
  v[d + 1] = xor0

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor0 >>> 24) ^ (xor1 << 8)
  v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8)

  ADD64AA(v, a, b)
  ADD64AC(v, a, y0, y1)

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = v[d] ^ v[a]
  xor1 = v[d + 1] ^ v[a + 1]
  v[d] = (xor0 >>> 16) ^ (xor1 << 16)
  v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16)

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor1 >>> 31) ^ (xor0 << 1)
  v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1)
}

// Initialization Vector
var BLAKE2B_IV32 = new Uint32Array([
  0xF3BCC908, 0x6A09E667, 0x84CAA73B, 0xBB67AE85,
  0xFE94F82B, 0x3C6EF372, 0x5F1D36F1, 0xA54FF53A,
  0xADE682D1, 0x510E527F, 0x2B3E6C1F, 0x9B05688C,
  0xFB41BD6B, 0x1F83D9AB, 0x137E2179, 0x5BE0CD19
])

var SIGMA8 = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
  7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
  9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
  2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
  12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
  13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
  6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
  10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3
]

// These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s
var SIGMA82 = new Uint8Array(SIGMA8.map(function (x) { return x * 2 }))

// Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s
var v = new Uint32Array(32)
var m = new Uint32Array(32)
function blake2bCompress (ctx, last) {
  var i = 0

  // init work variables
  for (i = 0; i < 16; i++) {
    v[i] = ctx.h[i]
    v[i + 16] = BLAKE2B_IV32[i]
  }

  // low 64 bits of offset
  v[24] = v[24] ^ ctx.t
  v[25] = v[25] ^ (ctx.t / 0x100000000)
  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    v[28] = ~v[28]
    v[29] = ~v[29]
  }

  // get little-endian words
  for (i = 0; i < 32; i++) {
    m[i] = B2B_GET32(ctx.b, 4 * i)
  }

  // twelve rounds of mixing
  for (i = 0; i < 12; i++) {
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1])
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3])
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5])
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7])
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9])
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11])
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13])
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15])
  }

  for (i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16]
  }
}

// reusable parameter_block
var parameter_block = new Uint8Array([
  0, 0, 0, 0,      //  0: outlen, keylen, fanout, depth
  0, 0, 0, 0,      //  4: leaf length, sequential mode
  0, 0, 0, 0,      //  8: node offset
  0, 0, 0, 0,      // 12: node offset
  0, 0, 0, 0,      // 16: node depth, inner length, rfu
  0, 0, 0, 0,      // 20: rfu
  0, 0, 0, 0,      // 24: rfu
  0, 0, 0, 0,      // 28: rfu
  0, 0, 0, 0,      // 32: salt
  0, 0, 0, 0,      // 36: salt
  0, 0, 0, 0,      // 40: salt
  0, 0, 0, 0,      // 44: salt
  0, 0, 0, 0,      // 48: personal
  0, 0, 0, 0,      // 52: personal
  0, 0, 0, 0,      // 56: personal
  0, 0, 0, 0       // 60: personal
])

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
function Blake2b (outlen, key, salt, personal) {
  // zero out parameter_block before usage
  parameter_block.fill(0)
  // state, 'param block'

  this.b = new Uint8Array(128)
  this.h = new Uint32Array(16)
  this.t = 0 // input count
  this.c = 0 // pointer within buffer
  this.outlen = outlen // output length in bytes

  parameter_block[0] = outlen
  if (key) parameter_block[1] = key.length
  parameter_block[2] = 1 // fanout
  parameter_block[3] = 1 // depth

  if (salt) parameter_block.set(salt, 32)
  if (personal) parameter_block.set(personal, 48)

  // initialize hash state
  for (var i = 0; i < 16; i++) {
    this.h[i] = BLAKE2B_IV32[i] ^ B2B_GET32(parameter_block, i * 4)
  }

  // key the hash, if applicable
  if (key) {
    blake2bUpdate(this, key)
    // at the end
    this.c = 128
  }
}

Blake2b.prototype.update = function (input) {
  blake2bUpdate(this, input)
  return this
}

Blake2b.prototype.digest = function (out) {
  var buf = (!out || out === 'binary' || out === 'hex') ? new Uint8Array(this.outlen) : out
  blake2bFinal(this, buf)
  if (out === 'hex') return hexSlice(buf)
  return buf
}

Blake2b.prototype.final = Blake2b.prototype.digest

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2bUpdate (ctx, input) {
  for (var i = 0; i < input.length; i++) {
    if (ctx.c === 128) { // buffer full ?
      ctx.t += ctx.c // add counters
      blake2bCompress(ctx, false) // compress (not last)
      ctx.c = 0 // counter to zero
    }
    ctx.b[ctx.c++] = input[i]
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal (ctx, out) {
  ctx.t += ctx.c // mark last block offset

  while (ctx.c < 128) { // fill up with zeros
    ctx.b[ctx.c++] = 0
  }
  blake2bCompress(ctx, true) // final block flag = 1

  for (var i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> (8 * (i & 3))
  }
  return out
}

function hexSlice (buf) {
  var str = ''
  for (var i = 0; i < buf.length; i++) str += toHex(buf[i])
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

module.exports = Blake2b;

},{}],15:[function(require,module,exports){
// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var bech32 = require('./bech32');

function convertbits (data, frombits, tobits, pad) {
  var acc = 0;
  var bits = 0;
  var ret = [];
  var maxv = (1 << tobits) - 1;
  for (var p = 0; p < data.length; ++p) {
    var value = data[p];
    if (value < 0 || (value >> frombits) !== 0) {
      return null;
    }
    acc = (acc << frombits) | value;
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (tobits - bits)) & maxv);
    }
  } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
    return null;
  }
  return ret;
}

function decode (hrp, addr) {
  var dec = bech32.decode(addr);
  if (dec === null || dec.hrp !== hrp || dec.data.length < 1 || dec.data[0] > 16) {
    return null;
  }
  var res = convertbits(dec.data.slice(1), 5, 8, false);
  if (res === null || res.length < 2 || res.length > 40) {
    return null;
  }
  if (dec.data[0] === 0 && res.length !== 20 && res.length !== 32) {
    return null;
  }
  return {version: dec.data[0], program: res};
}

function encode (hrp, version, program) {
  var ret = bech32.encode(hrp, [version].concat(convertbits(program, 8, 5, true)));
  if (decode(hrp, ret) === null) {
    return null;
  }
  return ret;
}

function isValidAddress(address) {
    var hrp = 'bc';
    var ret = decode(hrp, address);

    if (ret === null) {
        hrp = 'tb';
        ret = decode(hrp, address);
    }

    if (ret === null) {
        return false;
    }

    var recreate = encode(hrp, ret.version, ret.program);
    return recreate === address.toLowerCase();
}

module.exports = {
    encode: encode,
    decode: decode,
    isValidAddress: isValidAddress,
};

},{"./bech32":12}],16:[function(require,module,exports){
(function (process,global){
/**
 * [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 0.7.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2017
 * @license MIT
 */
/*jslint bitwise: true */
'use strict';

var ERROR = 'input is invalid type';
var WINDOW = typeof window === 'object';
var root = WINDOW ? window : {};
if (root.JS_SHA3_NO_WINDOW) {
    WINDOW = false;
}
var WEB_WORKER = !WINDOW && typeof self === 'object';
var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
if (NODE_JS) {
    root = global;
} else if (WEB_WORKER) {
    root = self;
}
var ARRAY_BUFFER = !root.JS_SHA3_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
var HEX_CHARS = '0123456789abcdef'.split('');
var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
var CSHAKE_PADDING = [4, 1024, 262144, 67108864];
var KECCAK_PADDING = [1, 256, 65536, 16777216];
var PADDING = [6, 1536, 393216, 100663296];
var SHIFT = [0, 8, 16, 24];
var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
    0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
    2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
    2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
    2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
var BITS = [224, 256, 384, 512];
var SHAKE_BITS = [128, 256];
var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
var CSHAKE_BYTEPAD = {
    '128': 168,
    '256': 136
};

if (root.JS_SHA3_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
}

if (ARRAY_BUFFER && (root.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
        return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
}

var createOutputMethod = function (bits, padding, outputType) {
    return function (message) {
        return new Keccak(bits, padding, bits).update(message)[outputType]();
    };
};

var createShakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits) {
        return new Keccak(bits, padding, outputBits).update(message)[outputType]();
    };
};

var createCshakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits, n, s) {
        return methods['cshake' + bits].update(message, outputBits, n, s)[outputType]();
    };
};

var createKmacOutputMethod = function (bits, padding, outputType) {
    return function (key, message, outputBits, s) {
        return methods['kmac' + bits].update(key, message, outputBits, s)[outputType]();
    };
};

var createOutputMethods = function (method, createMethod, bits, padding) {
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
        var type = OUTPUT_TYPES[i];
        method[type] = createMethod(bits, padding, type);
    }
    return method;
};

var createMethod = function (bits, padding) {
    var method = createOutputMethod(bits, padding, 'hex');
    method.create = function () {
        return new Keccak(bits, padding, bits);
    };
    method.update = function (message) {
        return method.create().update(message);
    };
    return createOutputMethods(method, createOutputMethod, bits, padding);
};

var createShakeMethod = function (bits, padding) {
    var method = createShakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits) {
        return new Keccak(bits, padding, outputBits);
    };
    method.update = function (message, outputBits) {
        return method.create(outputBits).update(message);
    };
    return createOutputMethods(method, createShakeOutputMethod, bits, padding);
};

var createCshakeMethod = function (bits, padding) {
    var w = CSHAKE_BYTEPAD[bits];
    var method = createCshakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits, n, s) {
        if (!n && !s) {
            return methods['shake' + bits].create(outputBits);
        } else {
            return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
        }
    };
    method.update = function (message, outputBits, n, s) {
        return method.create(outputBits, n, s).update(message);
    };
    return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
};

var createKmacMethod = function (bits, padding) {
    var w = CSHAKE_BYTEPAD[bits];
    var method = createKmacOutputMethod(bits, padding, 'hex');
    method.create = function (key, outputBits, s) {
        return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
    };
    method.update = function (key, message, outputBits, s) {
        return method.create(key, outputBits, s).update(message);
    };
    return createOutputMethods(method, createKmacOutputMethod, bits, padding);
};

var algorithms = [
    { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
    { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
    { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
    { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
    { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
];

var methods = {}, methodNames = [];

for (var i = 0; i < algorithms.length; ++i) {
    var algorithm = algorithms[i];
    var bits = algorithm.bits;
    for (var j = 0; j < bits.length; ++j) {
        var methodName = algorithm.name + '_' + bits[j];
        methodNames.push(methodName);
        methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
        if (algorithm.name !== 'sha3') {
            var newMethodName = algorithm.name + bits[j];
            methodNames.push(newMethodName);
            methods[newMethodName] = methods[methodName];
        }
    }
}

function Keccak(bits, padding, outputBits) {
    this.blocks = [];
    this.s = [];
    this.padding = padding;
    this.outputBits = outputBits;
    this.reset = true;
    this.finalized = false;
    this.block = 0;
    this.start = 0;
    this.blockCount = (1600 - (bits << 1)) >> 5;
    this.byteCount = this.blockCount << 2;
    this.outputBlocks = outputBits >> 5;
    this.extraBytes = (outputBits & 31) >> 3;

    for (var i = 0; i < 50; ++i) {
        this.s[i] = 0;
    }
}

Keccak.prototype.update = function (message) {
    if (this.finalized) {
        return;
    }
    var notString, type = typeof message;
    if (type !== 'string') {
        if (type === 'object') {
            if (message === null) {
                throw ERROR;
            } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
                message = new Uint8Array(message);
            } else if (!Array.isArray(message)) {
                if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                    throw ERROR;
                }
            }
        } else {
            throw ERROR;
        }
        notString = true;
    }
    var blocks = this.blocks, byteCount = this.byteCount, length = message.length,
        blockCount = this.blockCount, index = 0, s = this.s, i, code;

    while (index < length) {
        if (this.reset) {
            this.reset = false;
            blocks[0] = this.block;
            for (i = 1; i < blockCount + 1; ++i) {
                blocks[i] = 0;
            }
        }
        if (notString) {
            for (i = this.start; index < length && i < byteCount; ++index) {
                blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
            }
        } else {
            for (i = this.start; index < length && i < byteCount; ++index) {
                code = message.charCodeAt(index);
                if (code < 0x80) {
                    blocks[i >> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 0x800) {
                    blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                } else if (code < 0xd800 || code >= 0xe000) {
                    blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                } else {
                    code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                    blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                    blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                }
            }
        }
        this.lastByteIndex = i;
        if (i >= byteCount) {
            this.start = i - byteCount;
            this.block = blocks[blockCount];
            for (i = 0; i < blockCount; ++i) {
                s[i] ^= blocks[i];
            }
            f(s);
            this.reset = true;
        } else {
            this.start = i;
        }
    }
    return this;
};

Keccak.prototype.encode = function (x, right) {
    var o = x & 255, n = 1;
    var bytes = [o];
    x = x >> 8;
    o = x & 255;
    while (o > 0) {
        bytes.unshift(o);
        x = x >> 8;
        o = x & 255;
        ++n;
    }
    if (right) {
        bytes.push(n);
    } else {
        bytes.unshift(n);
    }
    this.update(bytes);
    return bytes.length;
};

Keccak.prototype.encodeString = function (str) {
    var notString, type = typeof str;
    if (type !== 'string') {
        if (type === 'object') {
            if (str === null) {
                throw ERROR;
            } else if (ARRAY_BUFFER && str.constructor === ArrayBuffer) {
                str = new Uint8Array(str);
            } else if (!Array.isArray(str)) {
                if (!ARRAY_BUFFER || !ArrayBuffer.isView(str)) {
                    throw ERROR;
                }
            }
        } else {
            throw ERROR;
        }
        notString = true;
    }
    var bytes = 0, length = str.length;
    if (notString) {
        bytes = length;
    } else {
        for (var i = 0; i < str.length; ++i) {
            var code = str.charCodeAt(i);
            if (code < 0x80) {
                bytes += 1;
            } else if (code < 0x800) {
                bytes += 2;
            } else if (code < 0xd800 || code >= 0xe000) {
                bytes += 3;
            } else {
                code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
                bytes += 4;
            }
        }
    }
    bytes += this.encode(bytes * 8);
    this.update(str);
    return bytes;
};

Keccak.prototype.bytepad = function (strs, w) {
    var bytes = this.encode(w);
    for (var i = 0; i < strs.length; ++i) {
        bytes += this.encodeString(strs[i]);
    }
    var paddingBytes = w - bytes % w;
    var zeros = [];
    zeros.length = paddingBytes;
    this.update(zeros);
    return this;
};

Keccak.prototype.finalize = function () {
    if (this.finalized) {
        return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
    blocks[i >> 2] |= this.padding[i & 3];
    if (this.lastByteIndex === this.byteCount) {
        blocks[0] = blocks[blockCount];
        for (i = 1; i < blockCount + 1; ++i) {
            blocks[i] = 0;
        }
    }
    blocks[blockCount - 1] |= 0x80000000;
    for (i = 0; i < blockCount; ++i) {
        s[i] ^= blocks[i];
    }
    f(s);
};

Keccak.prototype.toString = Keccak.prototype.hex = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var hex = '', block;
    while (j < outputBlocks) {
        for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
            block = s[i];
            hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
                HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
                HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
                HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
        }
        if (j % blockCount === 0) {
            f(s);
            i = 0;
        }
    }
    if (extraBytes) {
        block = s[i];
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
        if (extraBytes > 1) {
            hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
        }
        if (extraBytes > 2) {
            hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
        }
    }
    return hex;
};

Keccak.prototype.arrayBuffer = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var bytes = this.outputBits >> 3;
    var buffer;
    if (extraBytes) {
        buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
        buffer = new ArrayBuffer(bytes);
    }
    var array = new Uint32Array(buffer);
    while (j < outputBlocks) {
        for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
            array[j] = s[i];
        }
        if (j % blockCount === 0) {
            f(s);
        }
    }
    if (extraBytes) {
        array[i] = s[i];
        buffer = buffer.slice(0, bytes);
    }
    return buffer;
};

Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

Keccak.prototype.digest = Keccak.prototype.array = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var array = [], offset, block;
    while (j < outputBlocks) {
        for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
            offset = j << 2;
            block = s[i];
            array[offset] = block & 0xFF;
            array[offset + 1] = (block >> 8) & 0xFF;
            array[offset + 2] = (block >> 16) & 0xFF;
            array[offset + 3] = (block >> 24) & 0xFF;
        }
        if (j % blockCount === 0) {
            f(s);
        }
    }
    if (extraBytes) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xFF;
        if (extraBytes > 1) {
            array[offset + 1] = (block >> 8) & 0xFF;
        }
        if (extraBytes > 2) {
            array[offset + 2] = (block >> 16) & 0xFF;
        }
    }
    return array;
};

function Kmac(bits, padding, outputBits) {
    Keccak.call(this, bits, padding, outputBits);
}

Kmac.prototype = new Keccak();

Kmac.prototype.finalize = function () {
    this.encode(this.outputBits, true);
    return Keccak.prototype.finalize.call(this);
};

var f = function (s) {
    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
        b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
        b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
        b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
    for (n = 0; n < 48; n += 2) {
        c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
        c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
        c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
        c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
        c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
        c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
        c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
        c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
        c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
        c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

        h = c8 ^ ((c2 << 1) | (c3 >>> 31));
        l = c9 ^ ((c3 << 1) | (c2 >>> 31));
        s[0] ^= h;
        s[1] ^= l;
        s[10] ^= h;
        s[11] ^= l;
        s[20] ^= h;
        s[21] ^= l;
        s[30] ^= h;
        s[31] ^= l;
        s[40] ^= h;
        s[41] ^= l;
        h = c0 ^ ((c4 << 1) | (c5 >>> 31));
        l = c1 ^ ((c5 << 1) | (c4 >>> 31));
        s[2] ^= h;
        s[3] ^= l;
        s[12] ^= h;
        s[13] ^= l;
        s[22] ^= h;
        s[23] ^= l;
        s[32] ^= h;
        s[33] ^= l;
        s[42] ^= h;
        s[43] ^= l;
        h = c2 ^ ((c6 << 1) | (c7 >>> 31));
        l = c3 ^ ((c7 << 1) | (c6 >>> 31));
        s[4] ^= h;
        s[5] ^= l;
        s[14] ^= h;
        s[15] ^= l;
        s[24] ^= h;
        s[25] ^= l;
        s[34] ^= h;
        s[35] ^= l;
        s[44] ^= h;
        s[45] ^= l;
        h = c4 ^ ((c8 << 1) | (c9 >>> 31));
        l = c5 ^ ((c9 << 1) | (c8 >>> 31));
        s[6] ^= h;
        s[7] ^= l;
        s[16] ^= h;
        s[17] ^= l;
        s[26] ^= h;
        s[27] ^= l;
        s[36] ^= h;
        s[37] ^= l;
        s[46] ^= h;
        s[47] ^= l;
        h = c6 ^ ((c0 << 1) | (c1 >>> 31));
        l = c7 ^ ((c1 << 1) | (c0 >>> 31));
        s[8] ^= h;
        s[9] ^= l;
        s[18] ^= h;
        s[19] ^= l;
        s[28] ^= h;
        s[29] ^= l;
        s[38] ^= h;
        s[39] ^= l;
        s[48] ^= h;
        s[49] ^= l;

        b0 = s[0];
        b1 = s[1];
        b32 = (s[11] << 4) | (s[10] >>> 28);
        b33 = (s[10] << 4) | (s[11] >>> 28);
        b14 = (s[20] << 3) | (s[21] >>> 29);
        b15 = (s[21] << 3) | (s[20] >>> 29);
        b46 = (s[31] << 9) | (s[30] >>> 23);
        b47 = (s[30] << 9) | (s[31] >>> 23);
        b28 = (s[40] << 18) | (s[41] >>> 14);
        b29 = (s[41] << 18) | (s[40] >>> 14);
        b20 = (s[2] << 1) | (s[3] >>> 31);
        b21 = (s[3] << 1) | (s[2] >>> 31);
        b2 = (s[13] << 12) | (s[12] >>> 20);
        b3 = (s[12] << 12) | (s[13] >>> 20);
        b34 = (s[22] << 10) | (s[23] >>> 22);
        b35 = (s[23] << 10) | (s[22] >>> 22);
        b16 = (s[33] << 13) | (s[32] >>> 19);
        b17 = (s[32] << 13) | (s[33] >>> 19);
        b48 = (s[42] << 2) | (s[43] >>> 30);
        b49 = (s[43] << 2) | (s[42] >>> 30);
        b40 = (s[5] << 30) | (s[4] >>> 2);
        b41 = (s[4] << 30) | (s[5] >>> 2);
        b22 = (s[14] << 6) | (s[15] >>> 26);
        b23 = (s[15] << 6) | (s[14] >>> 26);
        b4 = (s[25] << 11) | (s[24] >>> 21);
        b5 = (s[24] << 11) | (s[25] >>> 21);
        b36 = (s[34] << 15) | (s[35] >>> 17);
        b37 = (s[35] << 15) | (s[34] >>> 17);
        b18 = (s[45] << 29) | (s[44] >>> 3);
        b19 = (s[44] << 29) | (s[45] >>> 3);
        b10 = (s[6] << 28) | (s[7] >>> 4);
        b11 = (s[7] << 28) | (s[6] >>> 4);
        b42 = (s[17] << 23) | (s[16] >>> 9);
        b43 = (s[16] << 23) | (s[17] >>> 9);
        b24 = (s[26] << 25) | (s[27] >>> 7);
        b25 = (s[27] << 25) | (s[26] >>> 7);
        b6 = (s[36] << 21) | (s[37] >>> 11);
        b7 = (s[37] << 21) | (s[36] >>> 11);
        b38 = (s[47] << 24) | (s[46] >>> 8);
        b39 = (s[46] << 24) | (s[47] >>> 8);
        b30 = (s[8] << 27) | (s[9] >>> 5);
        b31 = (s[9] << 27) | (s[8] >>> 5);
        b12 = (s[18] << 20) | (s[19] >>> 12);
        b13 = (s[19] << 20) | (s[18] >>> 12);
        b44 = (s[29] << 7) | (s[28] >>> 25);
        b45 = (s[28] << 7) | (s[29] >>> 25);
        b26 = (s[38] << 8) | (s[39] >>> 24);
        b27 = (s[39] << 8) | (s[38] >>> 24);
        b8 = (s[48] << 14) | (s[49] >>> 18);
        b9 = (s[49] << 14) | (s[48] >>> 18);

        s[0] = b0 ^ (~b2 & b4);
        s[1] = b1 ^ (~b3 & b5);
        s[10] = b10 ^ (~b12 & b14);
        s[11] = b11 ^ (~b13 & b15);
        s[20] = b20 ^ (~b22 & b24);
        s[21] = b21 ^ (~b23 & b25);
        s[30] = b30 ^ (~b32 & b34);
        s[31] = b31 ^ (~b33 & b35);
        s[40] = b40 ^ (~b42 & b44);
        s[41] = b41 ^ (~b43 & b45);
        s[2] = b2 ^ (~b4 & b6);
        s[3] = b3 ^ (~b5 & b7);
        s[12] = b12 ^ (~b14 & b16);
        s[13] = b13 ^ (~b15 & b17);
        s[22] = b22 ^ (~b24 & b26);
        s[23] = b23 ^ (~b25 & b27);
        s[32] = b32 ^ (~b34 & b36);
        s[33] = b33 ^ (~b35 & b37);
        s[42] = b42 ^ (~b44 & b46);
        s[43] = b43 ^ (~b45 & b47);
        s[4] = b4 ^ (~b6 & b8);
        s[5] = b5 ^ (~b7 & b9);
        s[14] = b14 ^ (~b16 & b18);
        s[15] = b15 ^ (~b17 & b19);
        s[24] = b24 ^ (~b26 & b28);
        s[25] = b25 ^ (~b27 & b29);
        s[34] = b34 ^ (~b36 & b38);
        s[35] = b35 ^ (~b37 & b39);
        s[44] = b44 ^ (~b46 & b48);
        s[45] = b45 ^ (~b47 & b49);
        s[6] = b6 ^ (~b8 & b0);
        s[7] = b7 ^ (~b9 & b1);
        s[16] = b16 ^ (~b18 & b10);
        s[17] = b17 ^ (~b19 & b11);
        s[26] = b26 ^ (~b28 & b20);
        s[27] = b27 ^ (~b29 & b21);
        s[36] = b36 ^ (~b38 & b30);
        s[37] = b37 ^ (~b39 & b31);
        s[46] = b46 ^ (~b48 & b40);
        s[47] = b47 ^ (~b49 & b41);
        s[8] = b8 ^ (~b0 & b2);
        s[9] = b9 ^ (~b1 & b3);
        s[18] = b18 ^ (~b10 & b12);
        s[19] = b19 ^ (~b11 & b13);
        s[28] = b28 ^ (~b20 & b22);
        s[29] = b29 ^ (~b21 & b23);
        s[38] = b38 ^ (~b30 & b32);
        s[39] = b39 ^ (~b31 & b33);
        s[48] = b48 ^ (~b40 & b42);
        s[49] = b49 ^ (~b41 & b43);

        s[0] ^= RC[n];
        s[1] ^= RC[n + 1];
    }
};

module.exports = methods;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":6}],17:[function(require,module,exports){
(function (Buffer){
var jsSHA = require("jssha/dist/sha256");
var Blake256 = require("./blake256");
var keccak256 = require("./sha3")["keccak256"];
var Blake2B = require("./blake2b");
var base58 = require("./base58");
var base32 = require("./base32");
var BigNum = require("browserify-bignum");

function numberToHex(number) {
    var hex = Math.round(number).toString(16);
    if (hex.length === 1) {
        hex = "0" + hex;
    }
    return hex;
}

function isHexChar(c) {
    if (
        (c >= "A" && c <= "F") ||
        (c >= "a" && c <= "f") ||
        (c >= "0" && c <= "9")
    ) {
        return 1;
    }
    return 0;
}

/* Convert a hex char to value */
function hexChar2byte(c) {
    var d = 0;
    if (c >= "A" && c <= "F") {
        d = c.charCodeAt(0) - "A".charCodeAt(0) + 10;
    } else if (c >= "a" && c <= "f") {
        d = c.charCodeAt(0) - "a".charCodeAt(0) + 10;
    } else if (c >= "0" && c <= "9") {
        d = c.charCodeAt(0) - "0".charCodeAt(0);
    }
    return d;
}

/* Convert a byte to string */
function byte2hexStr(byte) {
    var hexByteMap = "0123456789ABCDEF";
    var str = "";
    str += hexByteMap.charAt(byte >> 4);
    str += hexByteMap.charAt(byte & 0x0f);
    return str;
}

function byteArray2hexStr(byteArray) {
    var str = "";
    for (var i = 0; i < byteArray.length - 1; i++) {
        str += byte2hexStr(byteArray[i]);
    }
    str += byte2hexStr(byteArray[i]);
    return str;
}

function hexStr2byteArray(str) {
    var byteArray = Array();
    var d = 0;
    var i = 0;
    var j = 0;
    var k = 0;

    for (i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (isHexChar(c)) {
            d <<= 4;
            d += hexChar2byte(c);
            j++;
            if (0 === j % 2) {
                byteArray[k++] = d;
                d = 0;
            }
        }
    }
    return byteArray;
}

module.exports = {
    toHex: function (arrayOfBytes) {
        var hex = "";
        for (var i = 0; i < arrayOfBytes.length; i++) {
            hex += numberToHex(arrayOfBytes[i]);
        }
        return hex;
    },
    sha256: function (payload, format = "HEX") {
        var sha = new jsSHA("SHA-256", format);
        sha.update(payload);
        return sha.getHash(format);
    },
    sha256x2: function (buffer, format = "HEX") {
        return this.sha256(this.sha256(buffer, format), format);
    },
    sha256Checksum: function (payload) {
        return this.sha256(this.sha256(payload)).substr(0, 8);
    },
    blake256: function (hexString) {
        return new Blake256().update(hexString, "hex").digest("hex");
    },
    blake256Checksum: function (payload) {
        return this.blake256(this.blake256(payload)).substr(0, 8);
    },
    blake2b: function (hexString, outlen) {
        return new Blake2B(outlen)
            .update(Buffer.from(hexString, "hex"))
            .digest("hex");
    },
    keccak256: function (hexString) {
        return keccak256(hexString);
    },
    keccak256Checksum: function (payload) {
        return keccak256(payload).toString().substr(0, 8);
    },
    blake2b256: function (hexString) {
        return new Blake2B(32)
            .update(Buffer.from(hexString, "hex"), 32)
            .digest("hex");
    },
    base58: base58.decode,
    byteArray2hexStr: byteArray2hexStr,
    hexStr2byteArray: hexStr2byteArray,
    bigNumberToBuffer: function (bignumber, size) {
        return new BigNum(bignumber).toBuffer({ size, endian: "big" });
    },
    base32: base32,
};

}).call(this,require("buffer").Buffer)
},{"./base32":10,"./base58":11,"./blake256":13,"./blake2b":14,"./sha3":16,"browserify-bignum":2,"buffer":3,"jssha/dist/sha256":5}],18:[function(require,module,exports){
var ETHValidator = require("./ethereum_validator");
var BTCValidator = require("./bitcoin_validator");
var BCHValidator = require("./bch_validator");

// defines P2PKH and P2SH address types for standard (prod) and testnet networks
var CURRENCIES = [
    {
        name: "Bitcoin",
        symbol: "btc",
        addressTypes: { prod: ["00", "05"], testnet: ["6f", "c4", "3c", "26"] },
        validator: BTCValidator,
    },
    {
        name: "BitcoinCash",
        symbol: "bch",
        regexp: "^[qQpP]{1}[0-9a-zA-Z]{41}$",
        addressTypes: { prod: ["00", "05"], testnet: ["6f", "c4"] },
        validator: BCHValidator,
    },
    {
        name: "LiteCoin",
        symbol: "ltc",
        addressTypes: { prod: ["30", "05", "32"], testnet: ["6f", "c4", "3a"] },
        validator: BTCValidator,
    },
    {
        name: "DogeCoin",
        symbol: "doge",
        addressTypes: { prod: ["1e", "16"], testnet: ["71", "c4"] },
        validator: BTCValidator,
    },
    {
        name: "Ripple",
        symbol: "xrp",
        validator: XRPValidator,
    },
    {
        name: "Dash",
        symbol: "dash",
        addressTypes: { prod: ["4c", "10"], testnet: ["8c", "13"] },
        validator: BTCValidator,
    },
    {
        name: "Ethereum",
        symbol: "eth",
        validator: ETHValidator,
    },
];

module.exports = {
    getByNameOrSymbol: function (currencyNameOrSymbol) {
        var nameOrSymbol = currencyNameOrSymbol.toLowerCase();
        return CURRENCIES.find(function (currency) {
            return (
                currency.name.toLowerCase() === nameOrSymbol ||
                currency.symbol.toLowerCase() === nameOrSymbol
            );
        });
    },
    getAll: function () {
        return CURRENCIES;
    },
};

//spit out details for readme.md
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`* ${c.name}/${c.symbol} \`'${c.name}'\` or \`'${c.symbol}'\` `));

//spit out keywords for package.json
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`"${c.name}","${c.symbol}",`));

},{"./bch_validator":8,"./bitcoin_validator":9,"./ethereum_validator":19}],19:[function(require,module,exports){
var cryptoUtils = require('./crypto/utils');

module.exports = {
    isValidAddress: function (address) {
        if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
            // Check if it has the basic requirements of an address
            return false;
        }

        if (/^0x[0-9a-f]{40}$/.test(address) || /^0x?[0-9A-F]{40}$/.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        }

        // Otherwise check each case
        return this.verifyChecksum(address);
    },
    verifyChecksum: function (address) {
        // Check each case
        address = address.replace('0x','');

        var addressHash = cryptoUtils.keccak256(address.toLowerCase());

        for (var i = 0; i < 40; i++ ) {
            // The nth letter should be uppercase if the nth digit of casemap is 1
            if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
                (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
                return false;
            }
        }

        return true;
    }
};

},{"./crypto/utils":17}],20:[function(require,module,exports){
var currencies = require('./currencies');

var DEFAULT_CURRENCY_NAME = 'bitcoin';

module.exports = {
    validate: function (address, currencyNameOrSymbol, networkType) {
        var currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);

        if (currency && currency.validator) {
            return currency.validator.isValidAddress(address, currency, networkType);
        }

        throw new Error('Missing validator for currency: ' + currencyNameOrSymbol);
    },
    getCurrencies: function () {
        return currencies.getAll();
    },
    findCurrency: function(symbol) {
        return currencies.getByNameOrSymbol(symbol) || null ;
    }
};

},{"./currencies":18}]},{},[20])(20)
});
