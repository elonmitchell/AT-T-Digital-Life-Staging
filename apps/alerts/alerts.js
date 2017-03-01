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
    'apps/alerts/routers/AlertRouter',
    'apps/alerts/controllers/AlertsController',
    'css!alertsTheme/alerts.css',
    'i18n!apps/alerts/nls/Messages'
], function (Marionette, Logger, AlertRouter, AlertsController, i18n) {
    'use strict';
    Logger.info("Alerts : Create");
    var App = new Marionette.Application();

    Logger.info("Alerts : Add Initializer");
    App.addInitializer(function (options) {
        App.router = new AlertRouter({
            controller: new AlertsController({
                app : App,
                model : options.model
            })
        });
    });

    return App;
});