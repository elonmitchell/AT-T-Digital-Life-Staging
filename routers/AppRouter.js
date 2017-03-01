/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'backbone.marionette'
], function (Backbone, Marionette) {
    'use strict';
    var AppRouter = Marionette.AppRouter.extend({
        appRoutes: {
            "":                 "checkConnectivity",
            "validateLogin":    "validateLogin",
            "login":            "showLogin",
            "logout":           "logout",
            "authenticate":     "authenticationRequired",

            // Generic domain/service/operation
            // (menu routing)
            ":domain/:service": "launchDomainService",
            ":domain/:service/:operation": "launchServiceOperation"

        }
    });
    return AppRouter;
});
