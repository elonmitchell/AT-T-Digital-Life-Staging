/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App*/
/*global $, jQuery*/
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/alerts/nls/Messages',
    'apps/alerts/views/AlertsComposite'
], function (Marionette, _, Logger, i18n, AlertsCompositeView) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
            var self = this,
                services;
            self.app = options.app;
            self.model = options.model;
            self.alertsRendered = false;
            // Set the domain header image
            self.model.set(
                {'imageUrl' : i18n.get('alertHeaderImageURL')},
                {silent : true}
            );
            Logger.info("AlertsController: Initialize");
            self.setupEvents();
            services = self.model.get('services');
            if (services) {
                services.fetch({
                    success: function () {
                        Logger.debug("Alert Services Loaded");
                        if (services.length > 0) {
                            self.alertCollection = services.at(0).get('operations');
                            self.alertCollection.on("reset", self.checkForAlerts, self);
                            self.alertCollection.on("add", self.checkForAlerts, self);
                            self.alertCollection.on("delete", self.checkForAlerts, self);
                            self.alertCollection.fetch({
                                success: function (model, response, options) {
                                    Logger.debug("AlertsController : fetched alerts");
                                },
                                error: function (model, response, options) {
                                    Logger.error("AlertsController : error fetching alerts");
                                }
                            });
                        }
                    },
                    error: function () {
                        Logger.warn("Alert Services Failed to Load");
                    }
                });
            }

        },
        setupEvents: function () {
            var self = this;
            window.App.vent.on("dashboard:ready", function () {
                self.dashboardReady = true;
            });
        },
        checkForAlerts: function () {
            if (this.alertCollection.length > 0 && this.dashboardReady && !this.alertsRendered) {
                this.showAlerts();
            }
        },
        orderAlerts: function () {
            //Sort alerts by priority
            this.alertCollection.comparator = function (model) {
                return model.attributes.attributes.alertPriority;
            };
            this.alertCollection.sort();
        },
        showAlerts: function () {
            var self = this,
                alertsCompositeView;

            Logger.debug("AlertsController : build alerts views");

            self.orderAlerts();

            alertsCompositeView = new AlertsCompositeView({
                collection: self.alertCollection
            });
            alertsCompositeView.render();
            self.alertsRendered = true;
        }
    });
});
