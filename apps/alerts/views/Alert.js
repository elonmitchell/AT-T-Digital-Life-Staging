/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App*/
define([
    'jquery',
    'backbone',
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/alerts/nls/Messages',
    'tpl!apps/alerts/templates/Alert.html'
], function ($, Backbone, Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        tagName: "li",
        className: "alert-item",
        templateHelpers: function () {
            var attributes = this.model.get('attributes');
            return {
                i18n: i18n,
                attributes: attributes,
                getTitle: function () {
                    return attributes.alertTitle || "";
                },
                getDescription: function () {
                    return attributes.alertDescription || "";
                }
            };
        },
        events: {
            "click" : "launch"
        },
        initialize: function () {
            Logger.debug("AlertView : initialized");
        },
        onRender: function () {
            Logger.debug("AlertView : rendered");
            var attributes = this.model.get('attributes');
            this.$el.addClass("severity-" + attributes.alertSeverity);
        },
        showActive: function (target) {
            this.$el.parent().find(".active").removeClass("active");
            $(target).addClass("active");
        },
        launch: function (e) {
            e.preventDefault();
            Logger.debug("AlertView : Launch Alert Operation");
            this.showActive(e.currentTarget);
            var service = this.model.get("service"),
                domain = service.get("domain");

            // Set Header Icon
            domain.set("imageUrl", i18n.get("alertHeaderImageURL"));

            App.router.navigate(domain.id + "/" + service.id + "/" + this.model.id, {trigger: true, replace: false});
        }
    });
});