/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global device*/
define([
    'jquery',
    'backbone',
    'backbone.touch',
    'backbone.marionette',
    'underscore',
    'logger',
    'controllers/AppController',
    'routers/AppRouter',
    'models/Configuration',
    'i18n!nls/Messages',
    'css!sscTheme/ssc_styles.css'
], function ($, bb_nulled, Backbone, Marionette, _, Logger, AppController, AppRouter, ConfigurationModel, i18n) {
    'use strict';
    Logger.info("Create Application");
    Logger.info("Set page title");
    document.title = i18n.get("pageTitle");
    var App = new Marionette.Application();

    Logger.info("Add Application Regions");
    App.addRegions({
        content: "#ssc-content"
    });

    Logger.info("App : Add Application Initializer");
    App.addInitializer(function (options) {
        $.support.cors = true;

        App.configuration = new ConfigurationModel();

        // Setup console logging
        var enable = App.configuration.get('enableLogging') === "true",
            logLevel = parseInt(App.configuration.get('logLevel'), 10);
        if (enable) {
            Logger.turnOn(logLevel);
        } else {
            Logger.turnOff();
        }

        Logger.info("App : Add Application adding router");
        App.router = new AppRouter({
            controller: new AppController()
        });

        App.customDomains = ["alerts"];

    });

    App.getURLRoot = function () {
        return App.configuration.get("protocol") + "://" +
            App.configuration.get("hostname") + ":" +
            App.configuration.get("port") +
            App.configuration.get("path");
    };

    App.on("App : initialize:after", function () {
        if (Backbone.history) {
            location.hash = '';
            Backbone.history = Backbone.history || new Backbone.History({});
            Backbone.history.start();
        }
    });

    return App;
});