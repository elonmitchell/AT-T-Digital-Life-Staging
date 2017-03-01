/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/alerts/nls/Messages',
    'apps/alerts/views/Alert',
    'tpl!apps/alerts/templates/AlertsComposite.html'
], function (Marionette, _, Logger, i18n, AlertView, Template) {
    'use strict';
    return Marionette.CompositeView.extend({
        template: Template,
        itemView: AlertView,
        el: ".alerts-region",
        itemViewContainer: ".alerts-container",
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getAlertCount: function () {
                    return self.collection.length;
                }
            };
        },
        initialize: function () {
            Logger.debug("AlertsCompositeView : initialized");
            window.App.vent.on("alerts:close", this.hideAlerts, this);
        },
        events: {
            "click .alerts-header": "toggleAlerts"
        },
        collectionEvents: {
            "add": "onItemAdded"
        },
        onRender: function () {
            this.$itemViewContainer.hide();
            this.$el.find(".toggle-arrow").hide();
            window.App.vent.trigger("alerts:rendered");
        },
        onItemAdded: function () {
            if (this.collection.length === 1) {
                this.$el.show();
            }
            this.updateCount();
        },
        onItemRemoved: function () {
            var self = this;
            if (self.collection.length === 0) {
                self.$el.hide();
                Logger.debug("AlertsCompositeView : hidden");
            } else {
                self.updateCount();
            }
        },
        toggleAlerts: function (e) {
            e.preventDefault();
            if (this.$itemViewContainer.is(":visible")) {
                this.hideAlerts();
            } else {
                this.showAlerts();
            }
        },
        showAlerts: function () {
            this.$el.find(".toggle-arrow").fadeIn(200);
            this.$itemViewContainer.slideDown(200, function () {
                window.App.vent.trigger("suspendedFlows:close");
                window.App.vent.trigger("menu:clear");
            });
        },
        hideAlerts: function () {
            this.$el.find(".toggle-arrow").fadeOut(200);
            this.$el.find(".active").removeClass("active");
            this.$itemViewContainer.slideUp(200);
        },
        updateCount: function () {
            this.$el.find(".alert-count").text(this.collection.length);
        }
    });
});