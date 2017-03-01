/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'jquery',
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowMenu.html'
], function ($, Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        ui: {
            "item": ".item"
        },
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getBody: function () {
                    return self.model.get('body') || "";
                },
                getSignals: function () {
                    return self.model.get('validSignals') || "";
                }
            };
        },
        initialize: function (options) {
            var self = this,
                lazyHeight = _.debounce(self.resetItemHeight, 150);
            this.$el.on('click', this.ui.item, _.bind(self.onMenuSelect, this));
            this.controller = options.controller;
            window.App.vent.on("dashboard:resize", lazyHeight, this);
        },
        onMenuSelect: function (event) {
            Logger.info("Menu:onMenuSelect");
            var data = {},
                step,
                id = $(event.target).closest(".item").attr("id");
            if (this.model.get("activityName") !== null && this.model.get("activityName") !== undefined) {
                step = "steps." + this.model.get("activityName") + ".selection";
                data[step] = id;
            }
            // Block the href navigation
            event.preventDefault();
            this.model.set("signal", id);
            this.controller.signal(id, data);
            event.stopPropagation();
        },
        onShow: function () {
            this.setItemHeight();
        },
        resetItemHeight: function () {
            // Remove inline height
            if ($(this.ui.item).length) {
                $(this.ui.item).attr("style", "");
                this.setItemHeight();
            }
        },
        setItemHeight: function () {
            var adjustment = 0,
                thisHeight;
            $(this.ui.item).each(function (i, el) {
                thisHeight = $(el).height();
                if (thisHeight > adjustment) {
                    adjustment = thisHeight;
                }
            });

            if (adjustment > 0) {
                $(this.ui.item).height(adjustment);
            }
        }
    });
});
