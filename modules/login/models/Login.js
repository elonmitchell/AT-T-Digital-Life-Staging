/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
 */
define([
    'jquery',
    'backbone',
    'underscore',
    'environment',
    'logger'
], function ($, Backbone, _, Env, Logger) {
    'use strict';
    var Login = Backbone.Model.extend({
        defaults: {
            username: "",
            state: "NOT_AUTHENTICATED",
            subscriberId: "",
            protocol: "",
            hostname: "",
            port: "",
            csrMode: false,
            csrPort: "",
            xhrOptions: {},
            initParams: {}
        },
        LOGIN_TIMEOUT: 10000,
        LOGOUT_TIMEOUT: 10000,
        initialize: function () {
            Logger.info("Login : initialize");
        },
        validate: function () {
            Logger.info("Login : validate");
            var data;
            if (!_.isUndefined(this.get("anonymousNotAllowed")) && this.get("anonymousNotAllowed") === true) {
                data = {anonymous: "disabled"};
            } else {
                data = {};
            }
            if (this.attributes.validatePath !== "") {
                if (this.attributes.csrMode === true) {
                    this.authenticate(this.attributes.validatePath, this.attributes.csrPort, "validate", data);
                } else {
                    if (!_.isUndefined(window.App.cafid)) {
                        // Add in the mobile registration properties
                        _.extend(data, this.attributes.initParams);
                    }
                    this.authenticate(this.attributes.validatePath, this.attributes.port, "validate", data);
                }
            } else {
                this.trigger("not_authenticated");
            }
        },
        login: function (username, token, isGuest) {
            var data = {};

            // Clear the current state so any errors will
            // show if they still exist.
            this.set({
                state: "INVALIDATING"
            });

            // Check if cookies are enabled
            if (!Env.areCookiesEnabled()) {
                this.set({
                    state: "COOKIES_DISABLED"
                });
                this.trigger("not_authenticated");
                return;
            }
            if (isGuest === true) {
                Logger.info("Login : login as Guest");

                if (this.attributes.anonymousPath !== "") {
                    this.authenticate(this.attributes.anonymousPath, this.attributes.port, "guest", data);
                }
            } else {
                Logger.info("Login : login");
                data = {"username": username, "password": token};

                if (this.attributes.loginPath !== "") {
                    if (!_.isUndefined(window.App.cafid)) {
                        // Add in the mobile registration properties
                        _.extend(data, this.attributes.initParams);
                    }
                    this.authenticate(this.attributes.loginPath, this.attributes.port, "login", data);
                } else {
                    // For test purposes only
                    this.attributes.subscriberId = username;
                    _.delay(_.bind(this._auth_success, this), this.get("delay"));
                }
            }
        },
        _auth_success: function () {
            this.set({
                state: "AUTHENTICATION_SUCCESS"
            });
            this.trigger("authenticated");
        },
        logout: function () {
            var self = this;
            Logger.info("Login : logout - state  = " + this.attributes.state);
            if (this.attributes.state !== "NOT_AUTHENTICATED") {
                Logger.info("Login : logout - URL  = " + this.attributes.logoutPath);
                this.set({
                    state: "INVALIDATING"
                });
                this.trigger("invalidating");
                if (this.attributes.logoutPath !== "") {
                    $.ajax({
                        url: self.getURL(self.attributes.port) +  self.attributes.logoutPath + '?soaTraceId=' + window.App.sessionGUID,
                        type: "GET",
                        dataType: "html",
                        timeout: this.LOGOUT_TIMEOUT,
                        global: false,
                        xhrFields: self.attributes.xhrOptions,
                        success: function (data, status, xhr) {
                            Logger.info("Logout Success");
                            self.set({
                                state: "NOT_AUTHENTICATED"
                            });
                            self.trigger("logout");
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            Logger.info("Logout Failure: status = " + jqXHR.status + " textStatus = " + textStatus + " errorThrown = " + errorThrown);
                            self.set({
                                state: "NOT_AUTHENTICATED"
                            });
                            self.trigger("not_authenticated");
                        },
                        // Define the statusCode so that we do not use any overriden ones defined
                        // with ajaxSetup.
                        statusCode: {
                            401: function () {
                                Logger.debug("Logout : caught 401 ");
                            }
                        }
                    });
                } else {
                    self.set({
                        state: "NOT_AUTHENTICATED"
                    });
                    this.trigger("not_authenticated");
                }
            }
        },
        getURL: function (port) {
            var url = "";
            if (port !== "") {
                url = this.attributes.protocol + "://" + this.attributes.hostname + ":" + port + "/";
            } else if (this.attributes.hostname !== "") {
                url = this.attributes.protocol + "://" + this.attributes.hostname + "/";
            }
            return url;
        },
        authenticate: function (authPath, port, type, initData) {
            var self = this,
                path = authPath + '?soaTraceId=' + window.App.sessionGUID;

            if (!_.isUndefined(window.App.qParams) && !_.isUndefined(window.App.qParams.skipInitFlow)) {
                path += '&sscSkipInitWorkflow=true';
            }

            Logger.debug("Login : " + type + " - URL  = " + path);
            this.set({
                state: "AUTHENTICATING"
            });
            this.trigger("authenticating");
            $.ajax({
                url: self.getURL(port) + path,
                type: "POST",
                dataType: "json",
                data: initData,
                crossDomain: true,
                async: true,
                cache: false,
                timeout: this.LOGIN_TIMEOUT,
                global: false,
                xhrFields: self.attributes.xhrOptions,
                success: function (data, status, xhr) {
                    Logger.info(type + " Success data =" + JSON.stringify(data));
                    self.set({
                        state: "AUTHENTICATION_SUCCESS"
                    });
                    self.set(data);
                    self.trigger("authenticated");
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    Logger.info(type + " Failure: status = " + jqXHR.status + " textStatus = " + textStatus + " errorThrown = " + errorThrown);
                    if (type === 'validate') {
                        if (jqXHR.status === 503) {
                            self.set({
                                state: "SERVICE_UNAVAILABLE"
                            });
                        } else {
                            self.set({
                                state: "NOT_AUTHENTICATION"
                            });
                        }
                    } else {
                        if (jqXHR.status === 401) {
                            self.set({
                                state: "AUTHENTICATION_FAILURE"
                            });
                        } else if (jqXHR.status === 503) {
                            self.set({
                                state: "SERVICE_UNAVAILABLE"
                            });
                        } else {
                            self.set({
                                state: "CONNECTION_FAILURE"
                            });
                        }
                    }
                    self.trigger("not_authenticated");
                },
                // Define the statusCode so that we do not use any overriden ones defined
                // with ajaxSetup.
                statusCode: {
                    401: function () {
                        Logger.debug(type + " failure : caught 401 ");
                        if (type === "login") {
                            self.set({
                                state: "AUTHENTICATION_FAILURE"
                            });
                        } else {
                            self.set({
                                state: "NOT_AUTHENTICATED"
                            });
                        }
                    },
                    503: function () {
                        self.set({
                            state: "SERVICE_UNAVAILABLE"
                        });
                    }
                }
            });
        }
    });

    return Login;
});
