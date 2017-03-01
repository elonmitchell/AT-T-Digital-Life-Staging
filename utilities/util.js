/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([], function () {
    'use strict';
    return {
        parseQueryString: function (querystring) {
            // remove any preceding url and split
            var params = {},
                pair,
                idx = 0;

            if (querystring !== undefined && querystring.length > 0) {
                querystring = querystring.substring(querystring.indexOf('?') + 1).split('&');
                // march and parse
                for (idx = querystring.length - 1; idx >= 0; idx = idx - 1) {
                    pair = querystring[idx].split('=');
                    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                }
            }
            return params;
        },
        getTheme: function (querystring) {
            var theme = "",
                qsObj = this.parseQueryString(querystring);
            if (qsObj.theme) {
                theme = qsObj.theme;
                if (theme.charAt(0) !== "/") {
                    theme = "/".concat(theme);
                }
            }
            return theme;
        },
        generateUUID: function () {
            var dt = new Date().getTime(),
                rseed = 0,
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    rseed = (dt + Math.random() * 16) % 16 | 0;
                    dt = Math.floor(dt / 16);
                    return (c === 'x' ? rseed : (rseed & 0x7 | 0x8)).toString(16);
                });
            return uuid;
        }
    };
});

