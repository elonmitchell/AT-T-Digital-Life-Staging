/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
 */
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowFooter.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getFooter : function () {
                    return self.model.get('footer') || "";
                }
            };
        },
        modelEvents: {
            "change": "render"
        },
        events: {
            "click #cancel" : "onCancel"
        },
        initialize: function (options) {
            var self = this;
            this.$el.on('click', '#cancel', _.bind(self.onCancel, this));
            this.controller = options.controller;
        },
        onCancel: function () {
            Logger.info("Cancel pressed");
            this.controller.cancel();
        }
    });
});
