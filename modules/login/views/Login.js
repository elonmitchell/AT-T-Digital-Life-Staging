/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
// Filename: views/Login.js
define([
    'jquery',
    'underscore',
    'logger',
    'modules/login/views/BaseLogin',
    'i18n!modules/login/nls/Login',
    'tpl!modules/login/templates/Login.html'
], function ($, _, Logger, BaseLogin, i18n, Template) {
    'use strict';
    return BaseLogin.extend({
        options: {
            usernameRegex: "^\\w+$",
            passwordRegex: "^\\w+$"
        },
        template: Template,
        events: {
            "keypress input#username"       : "filterOnEnter",
            "keypress input[type=password]" : "filterOnEnter"
        },
        modelEvents: {
            "change:state"      : "loginStateChanged",
            "change:username"   : "update",
            "change:password"   : "update"
        },
        errors: {
            loginError      : i18n.get('loginError'),
            connectionError : i18n.get('connectionError'),
            serviceUnavailable : i18n.get('serviceUnavailable'),
            noCookiesError  : i18n.get('noCookiesError'),
            usernameError   : i18n.get('usernameError'),
            passwordError   : i18n.get('passwordError')
        },
        ui: {
            button          : ".login",
            username        : "#username",
            userField       : '.user-field',
            password        : '#user-password',
            passwordField   : '.password-field',
            errorDisplay    : '#error-display'
        },
        onRender: function () {
            Logger.info("BaseLoginView:onRender");

            var self = this;
            this.$el.on('click', '.login', _.bind(self.login, this));
            this.$el.on('click', '.guestlogin', _.bind(self.guestlogin, this));
            this.update();
        },
        onBeforeClose: function () {
            this.spinner.stop();
            this.$el.off('click');
        },
        showError: function (error) {
            if (error !== this.ui.errorDisplay.text() || !this.ui.errorDisplay.is(":visible")) {
                this.ui.errorDisplay.fadeOut(200, function () {
                    $(this).text(error).fadeIn(200);
                });
            }
        },
        addInputError: function ($elem) {
            $elem.closest(".form-group").addClass('has-error');
        },
        removeInputErrors: function () {
            this.$el.find(".has-error").removeClass('has-error');
        },
        focusOnElement: function ($elem) {
            var temp = $elem.val();
            $elem.focus().select().val(temp);
        },
        filterOnEnter: function (event) {
            Logger.info("BaseLoginView:filterOnEvent");
            if (event.keyCode !== 13) {
                return;
            }
            this.login();
        },
        login: function (event) {
            Logger.info("BaseLoginView:login");
            var username = this.ui.username.val(),
                token = this.ui.password.val(),
                error = false;

            Logger.info("BaseLoginView : username = " + username);

            // If already authenticating, do nothing
            if (this.authenticating) {
                return false;
            }

            // Hide error notifications
            this.removeInputErrors();

            // Validate input
            error = this.clientSideValidate();

            // No client-side validation error
            // OK to proceed to login
            if (!error) {
                this.ui.errorDisplay.hide('fast');
                this.model.login(username, token);
            }
        },
        guestlogin: function (event) {
            Logger.info("BaseLoginView:guestlogin");

            // If already authenticating, do nothing
            if (this.authenticating) {
                return false;
            }

            // Hide error notifications
            this.removeInputErrors();

            this.ui.errorDisplay.hide('fast');
            this.model.login("", "", true);
        },
        clientSideValidate: function () {
            var error = false,
                usernameRegex = new RegExp(this.options.usernameRegex),
                passwordRegex = new RegExp(this.options.passwordRegex),
                username = this.ui.username.val(),
                token = this.ui.password.val();

            if (!usernameRegex.test(username)) {
                Logger.info("LoginView : username error");
                error = true;
                this.showError(this.errors.usernameError);
                this.addInputError(this.ui.username);
                this.focusOnElement(this.ui.username);
            } else if (!passwordRegex.test(token)) {
                Logger.info("LoginView : token error");
                error = true;
                this.showError(this.errors.passwordError);
                this.addInputError(this.ui.password);
                this.focusOnElement(this.ui.password);
            }

            return error;
        },
        // Populate input values of login form
        update: function () {
            Logger.info("BaseLoginView:update");

            var username = this.model.get("username") || "",
                password = this.model.get("password") || "";

            Logger.debug("username=" + username);

            this.ui.username.val(username);
            this.ui.password.val(password);
        },
        loginStateChanged: function () {
            Logger.info("LoginView : loginStateChanged ");
            var loginState = this.model.get("state");
            this.ui.button.addClass("loading");
            this.ui.errorDisplay.hide();
            switch (loginState) {
            case "NOT_AUTHENTICATED":
                this.removeInputErrors();
                this.authenticating = false;
                this.spinner.stop();
                this.ui.button.removeClass("loading");
                break;
            case "AUTHENTICATING":
                this.removeInputErrors();
                this.authenticating = true;
                this.ui.button.addClass("loading");
                this.spinner.spin(this.$(".login-spinner")[0]);
                break;
            case "AUTHENTICATION_SUCCESS":
                this.authenticating = false;
                break;
            case "AUTHENTICATION_FAILURE":
                this.authenticating = false;
                $('#Login').stop().fadeTo('fast', 1);
                this.showError(this.errors.loginError);
                this.spinner.stop();
                this.ui.button.removeClass("loading");
                break;
            case "CONNECTION_FAILURE":
                this.authenticating = false;
                $('#Login').stop().fadeTo('fast', 1);
                this.showError(this.errors.connectionError);
                this.spinner.stop();
                this.ui.button.removeClass("loading");
                break;
            case "SERVICE_UNAVAILABLE":
                this.authenticating = false;
                $('#Login').stop().fadeTo('fast', 1);
                this.showError(this.errors.serviceUnavailable);
                this.spinner.stop();
                this.ui.button.removeClass("loading");
                break;
            case "COOKIES_DISABLED":
                this.authenticating = false;
                $('#Login').stop().fadeTo('fast', 1);
                this.showError(this.errors.noCookiesError);
                this.spinner.stop();
                this.ui.button.removeClass("loading");
                break;
            case "INVALIDATING":
                break;
            }
        }
    });
});
