/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define(function () {
    var environment = {
        browserName: "",
        browserVersion: "",
        platform: "",
        OSName: "",
        userAgent: null,
        setUserAgent: function (ua) {
            this.userAgent = ua;
        },
        getEnvironment: function (data) {
            if (data === null || data === 'undefined') {
                data = {};
            }
            data.broName = this.getBrowserName();
            data.broVersion = this.getBrowserVersion();
            data.OSName = this.getOSName();
            data.platform = this.getPlatform();
            data.isMetroMode = ((this.isBrowserSupportPlugin() === false) && (this.isFullScreen() === true));
        },
        getPlatform: function () {
            if (this.platform !== "") {
                return this.platform;
            }
            this.platform = navigator.platform;
            return this.platform;
        },
        getOSName: function () {
            // Get the OSName
            if (this.OSName !== "") {
                return this.OSName;
            }

            var agent = this.userAgent === null ? navigator.userAgent : this.userAgent,
                osName = "Unknown";
            if (agent.indexOf('Windows Phone') !== -1) {
                osName = "Windows Phone";
            } else if (agent.indexOf('Win') !== -1) {
                osName = "Windows";
            } else if (agent.indexOf('Mobile') !== -1) {
                osName = "Mobile";
            } else if (agent.indexOf("Mac") !== -1) {
                osName = "MacOS";
            } else if (agent.indexOf("Linux") !== -1) {
                osName = "Linux";
            } else if (agent.indexOf("X11") !== -1) {
                osName = "UNIX";
            }
            this.OSName = osName;
            return osName;
        },
        getBrowserName: function () {
            if (this.browserName !== "") {
                return this.browserName;
            }

            var verOffset,
                browserName = "Unknown",
                agent = this.userAgent === null ? navigator.userAgent : this.userAgent;

            if ((verOffset = agent.indexOf("Opera")) !== -1) {
                browserName = "Opera";
            } else if (((verOffset = agent.indexOf("MSIE")) !== -1) ||
                    ((verOffset = agent.indexOf("Trident")) !== -1)) {
                browserName = "Microsoft Internet Explorer";
            } else if ((verOffset = agent.indexOf("Chrome")) !== -1) {
                browserName = "Google Chrome";
            } else if ((verOffset = agent.indexOf("Safari")) !== -1) {
                browserName = "Apple Safari";
            } else if ((verOffset = agent.indexOf("Firefox")) !== -1) {
                browserName = "Mozilla Firefox";
            } else if ((nameOffset = agent.lastIndexOf(' ') + 1) < (verOffset = agent.lastIndexOf('/'))) {
                browserName = agent.substring(nameOffset, verOffset);
            }
            this.browserName = browserName;
            return this.browserName;
        },
        getBrowserVersion: function () {
            if (this.browserVersion !== "") {
                return this.browserVersion;

            }
            var verOffset,
                browserVersion = "",
                agent = this.userAgent === null ? navigator.userAgent : this.userAgent,
                verStore = [];

            // In Opera, the true version is after "Opera" or after "Version"
            if ((verOffset = agent.indexOf("Opera")) !== -1) {
                browserVersion = agent.substring(verOffset + 6);
                if ((verOffset = agent.indexOf("Version")) !== -1) {
                    browserVersion = agent.substring(verOffset + 8);
                }
            } else if ((verOffset = agent.indexOf("MSIE")) !== -1) {
                // In MSIE, the true version is after "MSIE" in userAgent
                browserVersion = agent.substring(verOffset + 5);
                verStore = browserVersion.split(';');
                browserVersion = verStore[0];
            } else if ((verOffset = agent.indexOf("Trident")) !== -1) {
                // IE 11 check
                verOffset = agent.indexOf("; rv");
                if (verOffset !== -1) {
                    browserVersion = agent.substring(verOffset + 5);
                    browserVersion = browserVersion.substring(0, browserVersion.length - 1);
                    verStore = browserVersion.split(')');
                    browserVersion = verStore[0];
                }
            } else if ((verOffset = agent.indexOf("Chrome")) !== -1) {
                // In Chrome, the true version is after "Chrome"
                browserVersion = agent.substring(verOffset + 7);
            } else if ((verOffset = agent.indexOf("Safari")) !== -1) {
                // In Safari, the true version is after "Safari" or after "Version"
                browserVersion = agent.substring(verOffset + 7);
                if ((verOffset = agent.indexOf("Version")) !== -1) {
                    browserVersion = agent.substring(verOffset + 8);
                }
            } else if ((verOffset = agent.indexOf("Firefox")) !== -1) {
                // In Firefox, the true version is after "Firefox"
                browserVersion = agent.substring(verOffset + 8);
            } else if ((nameOffset = agent.lastIndexOf(' ') + 1) < (verOffset = agent.lastIndexOf('/'))) {
                // In most other browsers, "name/version" is at the end of userAgent
                browserVersion = agent.substring(verOffset + 1);
            }
            this.browserVersion = browserVersion;
            return this.browserVersion;
        },
        isBrowserSupportPlugin: function () {
            /**************
             **** Windows 8 IE Metro/Desktop mode check
             **** Check ActiveXOject Supported.
             **** In MetroMode IE does not support ActiveXObjects.
             **************/
            var supported = false;

            try
            {
                new ActiveXObject("");
            }
            catch (e)
            {
                // FF has ReferenceError here
                errorName = e.name;
            }
            try
            {
                supported = !!new ActiveXObject("htmlfile");
            }
            catch (e)
            {
                supported = false;
            }

            if (errorName !== 'ReferenceError' && supported === false)
            {
                supported = false;
            }
            else
            {
                supported = true;
            }
            return supported;
        },
        isFullScreen: function () {
            // Windows 8 IE Metro/Desktop mode check
            if ((window.innerWidth === screen.width) && (window.innerHeight === screen.height))
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        areCookiesEnabled: function () {
            "use strict";
            var cookieEnabled = !!(navigator.cookieEnabled);

            if (typeof navigator.cookieEnabled === "undefined" && !cookieEnabled)
            {
                document.cookie="testcookie";
                cookieEnabled = !!(document.cookie.indexOf("testcookie") != -1);
            }
            return cookieEnabled;
        },
        isDesktopBrowser: function () {
            return (typeof window.orientation === 'undefined');
        }
    };
    return environment;
});

