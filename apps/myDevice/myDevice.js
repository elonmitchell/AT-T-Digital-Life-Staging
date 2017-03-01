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
    'apps/myDevice/routers/MyDeviceRouter',
    'apps/myDevice/controllers/MyDeviceController',
    'i18n!apps/myDevice/nls/Messages',
    'css!apps/myDevice/styles/mydevice.css'
], function (Marionette, Logger, MyDeviceRouter, MyDeviceController, i18n) {
    'use strict';
    Logger.info("MyDevice : Create");
    var App = new Marionette.Application();

    Logger.info("MyDevice : Add Initializer");
    App.addInitializer(function (options) {
        Logger.debug("My Device Initialization");
        App.router = new MyDeviceRouter({
            controller: new MyDeviceController({model: options.model})
        });
    });
    return App;
});