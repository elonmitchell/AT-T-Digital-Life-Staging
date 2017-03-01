/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/**
 * @license RequireJS i18n 2.0.1+ Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/i18n for details
 */
/******************************************************************************
 * jquery.i18n.properties
 *
 * Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and
 * MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
 *
 * @version     1.0.x
 * @author      Nuno Fernandes
 * @url         www.codingwithcoffee.com
 * @inspiration Localisation assistance for jQuery (http://keith-wood.name/localisation.html)
 *              by Keith Wood (kbwood{at}iinet.com.au) June 2007
 *
 *****************************************************************************/
/*jslint regexp: true */
/*global require: false, navigator: false, define: false */
(function () {
    'use strict';
    var map = {};

    /** Parse .properties files */
    function parseData(data, locale) {
        var parsed = '';
        var parameters = data.split( /\n/ );
        var regPlaceHolder = /(\{\d+\})/g;
        var regRepPlaceHolder = /\{(\d+)\}/g;
        var unicodeRE = /(\\u.{4})/ig;
        for(var i=0; i<parameters.length; i++ ) {
            parameters[i] = parameters[i].replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim

            if(parameters[i].length > 0 && parameters[i].match("^#")!="#") { // skip comments
                var pair = parameters[i].split('=');
                if(pair.length > 0) {
                    /** Process key & value */
                    var name = unescape(pair[0]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
                    var value = pair.length == 1 ? "" : pair[1];
                    // process multi-line values
                    while(value.match(/\\$/)=="\\") {
                        value = value.substring(0, value.length - 1);
                        value += parameters[++i].replace( /\s\s*$/, '' ); // right trim
                    }
                    // Put values with embedded '='s back together
                    for(var s=2;s<pair.length;s++){ value +='=' + pair[s]; }
                    value = value.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim

                    // handle unicode chars possibly left out
                    var unicodeMatches = value.match(unicodeRE);
                    if(unicodeMatches) {
                        for(var u=0; u<unicodeMatches.length; u++) {
                            value = value.replace( unicodeMatches[u], unescapeUnicode(unicodeMatches[u]));
                        }
                    }
                    // add to map
                    if( typeof map[locale] === "undefined") {
                        map[locale] = {};
                    }
                    map[locale][name] = value;
                } // END: if(pair.length > 0)
            } // END: skip comments
        }
        eval(parsed);
    }

    /** Ensure language code is in the format aa_AA. */
    function normaliseLanguageCode(lang) {
        lang = lang.toLowerCase();
        if(lang.length > 3) {
            lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
        }
        // Convert to Java format
        lang = lang.replace('-', '_');
        return lang;
    }

    /** Unescape unicode chars ('\u00e3') */
    function unescapeUnicode(str) {
        // unescape unicode codes
        var codes = [];
        var code = parseInt(str.substr(2), 16);
        if (code >= 0 && code < Math.pow(2, 16)) {
            codes.push(code);
        }
        // convert codes to text
        var unescaped = '';
        for (var i = 0; i < codes.length; ++i) {
            unescaped += String.fromCharCode(codes[i]);
        }
        return unescaped;
    }

    /* Cross-Browser Split 1.0.1
     (c) Steven Levithan <stevenlevithan.com>; MIT License
     An ECMA-compliant, uniform cross-browser split method */
    var cbSplit;
    // avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
    if (!cbSplit) {
        cbSplit = function(str, separator, limit) {
            // if `separator` is not a regex, use the native `split`
            if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
                if(typeof cbSplit._nativeSplit == "undefined")
                    return str.split(separator, limit);
                else
                    return cbSplit._nativeSplit.call(str, separator, limit);
            }

            var output = [],
                lastLastIndex = 0,
                flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.sticky     ? "y" : ""),
                separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;

            str = str + ""; // type conversion

            if (!cbSplit._compliantExecNpcg) {
                separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
            }

            /* behavior for `limit`: if it's...
             - `undefined`: no limit.
             - `NaN` or zero: return an empty array.
             - a positive number: use `Math.floor(limit)`.
             - a negative number: no limit.
             - other: type-convert, then use the above rules. */
            if (limit === undefined || +limit < 0) {
                limit = Infinity;
            } else {
                limit = Math.floor(+limit);
                if (!limit) {
                    return [];
                }
            }

            while (match = separator.exec(str)) {
                lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

                if (lastIndex > lastLastIndex) {
                    output.push(str.slice(lastLastIndex, match.index));

                    // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
                    if (!cbSplit._compliantExecNpcg && match.length > 1) {
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (arguments[i] === undefined) {
                                    match[i] = undefined;
                                }
                            }
                        });
                    }

                    if (match.length > 1 && match.index < str.length) {
                        Array.prototype.push.apply(output, match.slice(1));
                    }

                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;

                    if (output.length >= limit) {
                        break;
                    }
                }

                if (separator.lastIndex === match.index) {
                    separator.lastIndex++; // avoid an infinite loop
                }
            }

            if (lastLastIndex === str.length) {
                if (lastLength || !separator.test("")) {
                    output.push("");
                }
            } else {
                output.push(str.slice(lastLastIndex));
            }

            return output.length > limit ? output.slice(0, limit) : output;
        };

        cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
        cbSplit._nativeSplit = String.prototype.split;

    } // end `if (!cbSplit)`

    String.prototype.split = function (separator, limit) {
        return cbSplit(this, separator, limit);
    };

    /**
     * When configured with mode: 'map', allows access to bundle values by specifying its key.
     * Eg, jQuery.i18n.prop('com.company.bundles.menu_add')
     */
    function prop(locale, key /* Add parameters as function arguments as necessary  */) {
        var args = Array.prototype.slice.call(arguments),
            value = map[locale] ? map[locale][key] : null;

        if (typeof(value) === "undefined" || value === null)
            return null;

        args.shift(); // Shift out the locale

//  if(arguments.length < 2) // No arguments.
//    //if(key == 'spv.lbl.modified') {alert(value);}
//      return value;

//  if (!$.isArray(placeHolderValues)) {
//      // If placeHolderValues is not an array, make it into one.
//      placeHolderValues = [placeHolderValues];
//      for (var i=2; i<arguments.length; i++)
//          placeHolderValues.push(arguments[i]);
//  }

        // Place holder replacement
        /**
         * Tested with:
         *   test.t1=asdf ''{0}''
         *   test.t2=asdf '{0}' '{1}'{1}'zxcv
         *   test.t3=This is \"a quote" 'a''{0}''s'd{fgh{ij'
     *   test.t4="'''{'0}''" {0}{a}
     *   test.t5="'''{0}'''" {1}
     *   test.t6=a {1} b {0} c
     *   test.t7=a 'quoted \\ s\ttringy' \t\t x
     *
     * Produces:
     *   test.t1, p1 ==> asdf 'p1'
     *   test.t2, p1 ==> asdf {0} {1}{1}zxcv
     *   test.t3, p1 ==> This is "a quote" a'{0}'sd{fgh{ij
     *   test.t4, p1 ==> "'{0}'" p1{a}
     *   test.t5, p1 ==> "'{0}'" {1}
     *   test.t6, p1 ==> a {1} b p1 c
     *   test.t6, p1, p2 ==> a p2 b p1 c
     *   test.t6, p1, p2, p3 ==> a p2 b p1 c
     *   test.t7 ==> a quoted \ s   tringy       x
     */

        var i;
        if (typeof(value) == 'string') {
            // Handle escape characters. Done separately from the tokenizing loop below because escape characters are
            // active in quoted strings.
            i = 0;
            while ((i = value.indexOf('\\', i)) != -1) {
                if (value[i+1] == 't')
                    value = value.substring(0, i) + '\t' + value.substring((i++) + 2); // tab
                else if (value[i+1] == 'r')
                    value = value.substring(0, i) + '\r' + value.substring((i++) + 2); // return
                else if (value[i+1] == 'n')
                    value = value.substring(0, i) + '\n' + value.substring((i++) + 2); // line feed
                else if (value[i+1] == 'f')
                    value = value.substring(0, i) + '\f' + value.substring((i++) + 2); // form feed
                else if (value[i+1] == '\\')
                    value = value.substring(0, i) + '\\' + value.substring((i++) + 2); // \
                else
                    value = value.substring(0, i) + value.substring(i+1); // Quietly drop the character
            }
            // Lazily convert the string to a list of tokens.
            var arr = [], j, index;
            i = 0;
            while (i < value.length) {
                if (value[i] == '\'') {
                    // Handle quotes
                    if (i == value.length-1)
                        value = value.substring(0, i); // Silently drop the trailing quote
                    else if (value[i+1] == '\'')
                        value = value.substring(0, i) + value.substring(++i); // Escaped quote
                    else {
                        // Quoted string
                        j = i + 2;
                        while ((j = value.indexOf('\'', j)) != -1) {
                            if (j == value.length-1 || value[j+1] != '\'') {
                                // Found start and end quotes. Remove them
                                value = value.substring(0,i) + value.substring(i+1, j) + value.substring(j+1);
                                i = j - 1;
                                break;
                            }
                            else {
                                // Found a double quote, reduce to a single quote.
                                value = value.substring(0,j) + value.substring(++j);
                            }
                        }

                        if (j == -1) {
                            // There is no end quote. Drop the start quote
                            value = value.substring(0,i) + value.substring(i+1);
                        }
                    }
                }
                else if (value[i] == '{') {
                    // Beginning of an unquoted place holder.
                    j = value.indexOf('}', i+1);
                    if (j == -1)
                        i++; // No end. Process the rest of the line. Java would throw an exception
                    else {
                        // Add 1 to the index so that it aligns with the function arguments.
                        index = parseInt(value.substring(i+1, j));
                        if (!isNaN(index) && index >= 0) {
                            // Put the line thus far (if it isn't empty) into the array
                            var s = value.substring(0, i);
                            if (s != "")
                                arr.push(s);
                            // Put the parameter reference into the array
                            arr.push(index);
                            // Start the processing over again starting from the rest of the line.
                            i = 0;
                            value = value.substring(j+1);
                        }
                        else
                            i = j + 1; // Invalid parameter. Leave as is.
                    }
                }
                else
                    i++;
            }

            // Put the remainder of the no-empty line into the array.
            if (value !== "")
                arr.push(value);
            value = arr;

            // Make the array the value for the entry.
            map[locale][key] = arr;

        }

        if (value.length == 0)
            return "";
        if (value.length == 1 && typeof(value[0]) == "string")
            return value[0];

        var s = "";
        for (i=0; i<value.length; i++) {
            if (typeof(value[i]) == "string")
                s += value[i];
            // Must be a number
            else if (value[i] + 1 < args.length)
                s += args[value[i] + 1];
            else
                s += "{"+ value[i] +"}";
        }

        return s;
    };

    function readFileAsync (path, success, error) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', path, true);
        try {
            xhr.send();
        } catch(ex) {
            error(0, ex);
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status > 400) {
                    error(xhr.status, xhr.statusText);
                } else {
                    success(xhr.responseText);
                }
            }
        };
    }

    define([
        'module'
    ], function (module) {
        var masterConfig = module.config ? module.config() : {};

        return {
            version: '1.0.0',
            load: function (name, require, load, config) {
                config = config || {};

                var files = [];

                if (config.isBuild) {
                    load();
                } else {
                    var locale = typeof navigator === "undefined" ? "" : (navigator.language || navigator.userLanguage);
                    var parts = locale.split("-");
                    var language = locale[0];
                    var country = locale[1];
                    var part;
                    var i;
                    var current = name;
                    var suffix = ".properties";
                    var i18n = {
                        get: function (key, defaultValue) {
                            var args = Array.prototype.slice.call(arguments)
                            args.shift(); // Shift out the key
                            if (key === undefined) {
                                return "";
                            } else if(typeof(key) === "string") {
                                args.unshift(locale, key);
                                value = prop.apply(this, args);
                                if (value != null) {
                                    return value;
                                }
                            } else {
                                for(var i=0; i<key.length; i++) {
                                    args.unshift(locale, key[i]);
                                    var value = prop.apply(this, args);
                                    if (value != null) {
                                        return value;
                                    }
                                }
                            }
                            return defaultValue !== undefined ? defaultValue : "[" + key + "]";;
                        },
                        /** Language reported by browser, normalized code */
                        lang: function () {
                            return normaliseLanguageCode(locale);
                        }
                    };

                    files.push(name + suffix);
                    for (i = 0; i < parts.length; i++) {
                        part = parts[i];
                        current += (current === name ? "_" : "-") + part;
                        files.push(current + suffix);
                    }

                    var complete = files.length;
                    var content = "";
                    
					var loadFile = function(files, idx) {
                        try {
                            require(["text!" + files[idx]],
                                function (text) {
                                    complete = complete - 1;
                                    parseData(text, locale);
                                    if(complete === 0) {
                                        load(i18n);
                                    }
                                    else {
                                    	loadFile(files, idx + 1);
                                    }
                                },
                                function (status, statusText) {
                                    complete = complete - 1;
                                    if(complete === 0) {
                                        load(i18n);
                                    }
                                    else {
                                    	loadFile(files, idx + 1);
                                    }
                                }
                            );
                        } catch (ex) {
                            Logger.debug(ex);
                            complete = complete - 1;
                            if(complete === 0) {
                                load(i18n);
                            }
                        }					
					}
					
					loadFile(files, 0);
                }
            }
        };
    });
}());