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
    'apps/wifi/controllers/WiFiController',
    'css!apps/wifi/styles/wifi.css',
    'i18n!apps/wifi/nls/Messages'
], function (Marionette, Logger, WiFiController, i18n) {
    'use strict';
    Logger.info("WiFi : Create");
    var App = new Marionette.Application();

    Logger.info("WiFi : Add Initializer");
    App.addInitializer(function (options) {
        App.controller = new WiFiController({
            app : App
        });
    });
    return App;
});