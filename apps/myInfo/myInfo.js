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
    'apps/myInfo/routers/MyInfoRouter',
    'apps/myInfo/controllers/MyInfoController',
    'i18n!apps/myInfo/nls/Messages',
    'css!myInfoTheme/myinfo.css'
], function (Marionette, Logger, MyInfoRouter, MyInfoController, i18n) {
    'use strict';
    Logger.info("MyInfo : Create");
    var App = new Marionette.Application();

    Logger.info("MyInfo : Add Initializer");
    App.addInitializer(function (options) {
        App.router = new MyInfoRouter({
            controller: new MyInfoController({model: options.model})
        });
        return App;
    });
    return App;
});