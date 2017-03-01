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
    'i18n!apps/internet/nls/Messages',
    'apps/internet/routers/InternetRouter',
    'apps/internet/controllers/InternetController',
    'css!apps/internet/styles/internet.css'
], function (Marionette, Logger,  i18n, InternetRouter, InternetController) {
    'use strict';
    var App = new Marionette.Application();
    App.addInitializer(function (options) {
        Logger.debug("Internet Initialization");
        App.router = new InternetRouter({
            controller: new InternetController({model: options.model})
        });
    });
    return App;
});