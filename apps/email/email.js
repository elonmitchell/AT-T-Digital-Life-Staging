/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone.marionette',
    'logger',
    'apps/email/controllers/EmailController',
    'css!apps/email/styles/email.css',
    'i18n!apps/email/nls/Messages'
], function (Marionette, Logger, EmailController) {
    'use strict';
    Logger.info("email : Create");
    var App = new Marionette.Application();

    Logger.info("email : Add Initializer");
    App.addInitializer(function (options) {
        App.controller = new EmailController({
            app : App,
            model : options.model
        });
    });
    return App;
});