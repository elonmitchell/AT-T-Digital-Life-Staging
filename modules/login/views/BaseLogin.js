/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'underscore',
    'backbone.marionette',
    'logger',
    'spin',
    'i18n!modules/login/nls/Login',
    'tpl!modules/login/templates/Login.html',
    'css!loginTheme/login.css'
], function (_, Marionette, Logger, Spinner, i18n, Template) {
    'use strict';
    var BaseLoginView = Marionette.ItemView.extend({
        id: "Login",
        options: {
            usernameRegex: "^\\w+$",
            passwordRegex: "^\\w+$"
        },
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                isMobileApp: function () {
                    if (window.App.platform) {
                        return true;
                    }
                    return false;
                },
                allowGuestLogin: function () {
                    return self.model.get('allowGuestLogin') === true;
                },
                isAnonymous: function () {
                    return self.model.get('anonymous') === true;
                },
                getErrorMsg: function () {
                    if (self.model.get('state') === "CONNECTION_FAILURE") {
                        return i18n.get('connectionError');
                    } else if (self.model.get('state') === "AUTHENTICATION_FAILURE") {
                        return i18n.get('loginError');
                    }
                    return "";
                }
            };
        },
        events: {
            "click #login" : "login",
            "click #guestLogin" : "guestLogin",
            "keypress input[type=password]": "filterOnEnter"
        },
        modelEvents: {
            "change:state": "loginStateChanged",
            "change:username": "update",
            "change:password": "update"
        },
        initialize: function () {
            Logger.debug("BaseLoginView:initialize");
            var self = this;
            this.opts = { lines: 10, length: 8, speed: 1.2, radius: 5, width: 2, corners: 1, trail: 60, className: 'spinner', zIndex: 2e9, color: '#fff', top: 'auto', left: '50%' };
            this.spinner = new Spinner(this.opts);
            if (this.options.showTaC === undefined) {
                this.options.showTaC = true;
            }
            this.$el.on('click', '#guestloginCancel', _.bind(self.cancelLogin, this));
        },
        onRender: function () {
            Logger.debug("BaseLoginView:onRender");

            this.update();
        },
        filterOnEnter: function (event) {
            Logger.debug("BaseLoginView:filterOnEvent");
            if (event.keyCode !== 13) {
                return;
            }
            this.login();
        },
        login: function () {
            Logger.debug("BaseLoginView:login");
            var error = false,
                username = this.$('#username').val(),
                token = this.$('#user-password').val(),
                usernameRegex = new RegExp(this.options.usernameRegex),
                passwordRegex = new RegExp(this.options.passwordRegex);
            Logger.debug("BaseLoginView : username = " + username);

            this.$("#usernameError").hide();
            this.$("#passwordError").hide();

            if (!usernameRegex.test(username)) {
                Logger.debug("LoginView : username error");
                this.$("#usernameError").show();
                error = true;
                this.focusOnUsername();
            } else if (!passwordRegex.test(token)) {
                Logger.debug("LoginView : token error");
                this.$("#passwordError").show();
                error = true;
                this.focusOnPassword();
            } else {
                this.errorKey = "";
            }

            if (!error) {
                this.model.login(username, token);
            }
        },
        guestLogin: function () {
            Logger.debug("BaseLoginView:guestLogin");
            this.model.login("", "", true);
        },
        cancelLogin: function () {
            Logger.debug("BaseLoginView:cancelLogin");
            window.App.vent.trigger("AppController:appLoadComplete");
        },
        focusOnUsername: function () {
            var temp = this.$("#username").val();

            this.$("#username").focus();
            this.$("#username").select();
            this.$("#username").val(temp);
        },
        focusOnPassword: function () {
            var temp = this.$("#token").val();

            this.$("#token").focus();
            this.$("#token").select();
            this.$("#token").val(temp);
        },
        update: function () {
            Logger.debug("BaseLoginView:update");

            var username = this.model.get("username") || "",
                password = this.model.get("password") || "";

            Logger.debug("username=" + username);

            this.$("#username").val(username);
            this.$("#token").val(password);
        },
        loginStateChanged: function () {
            Logger.debug("BaseLoginView : loginStateChanged ");
            var loginState = this.model.get("state");
            switch (loginState) {
            case "NOT_AUTHENTICATED":
                this.$('#login').removeClass('ui-disabled');
                this.$("#loginWait").hide();
                this.$("#loginError").hide();
                break;
            case "AUTHENTICATING":
                this.$('#login').addClass('ui-disabled');
                this.$("#loginWait").show();
                this.spinner.spin(this.$(".login-spinner")[0]);
                break;
            case "AUTHENTICATION_SUCCESS":
                this.spinner.stop();
                break;
            case "AUTHENTICATION_FAILURE":
                this.spinner.stop();
                this.$('#login').removeClass('ui-disabled');
                this.$("#loginWait").hide();
                this.$("#loginError").show();
                break;
            case "INVALIDATING":
                this.$('#login').addClass('ui-disabled');
                break;
            }
        }
    });
    return BaseLoginView;
});
