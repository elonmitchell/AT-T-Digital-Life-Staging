// Filename: libs/logger.js
// based on code by Craig Patik, found here: http://patik.com/blog/complete-cross-browser-console-log
// protected under the MIT/BSD/GPL license (as mentioned in the comments section by the author)
define(function () {
    'use strict';
    // tell IE9 to use its built-in console (this is run once and only for IE9)
    if (Function.prototype.bind && (typeof console === 'object' || typeof console === 'function') && typeof console.log === "object") {
        ["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"].forEach(function (method) {
            console[method] = this.call(console[method], console);
        }, Function.prototype.bind);
    }

    // set up the logger object...
    var logger = {
        _isLogging: true,
        _isDebugLogging: false,
        _debugLogData: "",
        _logMaxSize: 524288, // 1MB
        _levelDebug: 4,      // Debug log level
        _levelInfo: 3,       // Info log level
        _levelWarn: 2,       // Warn log level
        _levelError: 1,      // Error log level
        _currentLevel: 4,    // Initially set log level to levelDebug
        // logger.log simply routes log messages to console.log based on the current browser
        log: function (msg, level) {
            var timeStamp = this._timeAsISOString(),
                args = [],
                len = 0;

            // Take care of the case where Logger.log was called
            if (this._currentLevel >= this._levelDebug) {
                if (level === undefined) {
                    level = 'log';
                    msg = 'DEBUG| ' + msg;
                }
            } else {
                // Do not log the message since log level is not met
                return;
            }
            // Add timestamp
            args.push(timeStamp + ' |'+ msg);
            // Server initiated Debug logging
            if (this._isDebugLogging) {
                // Check to see if we are at max size, reset if so
                if (this._debugLogData.length > this._logMaxSize) {
                    len = args[0].toString().length;
                    this._debugLogData = this._debugLogData.substring(this._logMaxSize - len);
                }
                // Append current log message to the data we are returning
                this._debugLogData = this._debugLogData + "\r\n" + args[0];
            }

            // Console logging
            if (this._isLogging) {

                // Modern browsers
                if (typeof console !== 'undefined' && typeof console[level] === 'function') {
                    // Opera 11
                    if (window.opera) {
                        var i = 0;
                        while (i < args.length) {
                            console[level]("Item " + (i + 1) + ": " + args[i]);
                            i++;
                        }
                    }
                    // All other modern browsers
                    else if ((Array.prototype.slice.call(args)).length === 1 && typeof Array.prototype.slice.call(args)[0] === 'string') {
                        console[level]((Array.prototype.slice.call(args)).toString());
                    }
                    else {
//                        console.log(Array.prototype.slice.call(args));
                        console[level](Array.prototype.slice.call(args));
                    }
                }
                // IE8
                else if ((!Function.prototype.bind || (Function.prototype.bind && typeof window.addEventListener === 'undefined')) &&
                        typeof console != 'undefined' && typeof console[level] == 'object') {
                    Function.prototype.call.call(console[level], console, Array.prototype.slice.call(args));
                }
            }
        },
        turnOff: function () {
            this.info("logger - turnOff :: logging is OFF");
            this._isLogging = false;
            this._currentLevel = this._levelDebug;
        },
        turnOn: function (logLevel) {
            this._isLogging = true;
            if (logLevel !== undefined) {
                this._currentLevel = logLevel;
            }
            this.info("logger - turnOn :: logging is ON");
        },
        turnOffDebugLogging: function () {
            this._isDebugLogging = false;
            this._currentLevel = this._levelDebug;
        },
        turnOnDebugLogging: function (logLevel, maxLogSize) {
            this._isDebugLogging = true;
            if (logLevel !== undefined) {
                this._currentLevel = logLevel;
            }
            if (maxLogSize !== undefined) {
                this._logMaxSize = maxLogSize;
            }
            this.info("logger - turnOn :: logging is ON");
        },
        info: function () {
            if ((this._isLogging || this._isDebugLogging) && (this._currentLevel >= this._levelInfo)) {
                this.log('INFO| ' + arguments[0], 'info');
            }
        },
        debug: function () {
            if ((this._isLogging || this._isDebugLogging) && (this._currentLevel >= this._levelDebug)) {
                this.log('DEBUG| ' + arguments[0], 'log');
            }
        },
        warn: function () {
            if ((this._isLogging || this._isDebugLogging) && (this._currentLevel >= this._levelWarn)) {
                this.log('WARN| ' + arguments[0], 'warn');
            }
        },
        error: function () {
            if ((this._isLogging || this._isDebugLogging) && (this._currentLevel >= this._levelError)) {
                this.log('ERROR| ' + arguments[0], 'error');
            }
        },
        getDebugLogData: function () {
            var str = this._debugLogData;
            this._debugLogData = "";
            return str;
        },
        _timeAsISOString: function () {
            // This is needed due to IE8 not supporting Date.toISOString
            var dt = new Date();
            return dt.getUTCFullYear()
                + '-' + this._pad(dt.getUTCMonth() + 1)
                + '-' + this._pad(dt.getUTCDate())
                + 'T' + this._pad(dt.getUTCHours())
                + ':' + this._pad(dt.getUTCMinutes())
                + ':' + this._pad(dt.getUTCSeconds())
                + '.' + String((dt.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                + 'Z';
        },
        _pad: function (number) {
            var r = String(number);
            if (r.length === 1) {
                r = '0' + r;
            }
            return r;
        }
    };
    return logger;
});
