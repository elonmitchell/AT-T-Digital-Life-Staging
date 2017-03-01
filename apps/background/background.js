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
    'apps/background/controllers/BackgroundController'
], function (Marionette, Logger, BackgroundController) {
    'use strict';
    Logger.info("Background : Create");
    var App = new Marionette.Application();

    Logger.info("Background : Add Initializer");
    App.addInitializer(function (options) {
        App.controller = new BackgroundController({
            app : App,
            model : options.model
        });
    });
    return App;
});