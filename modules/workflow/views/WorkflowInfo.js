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
    'tpl!modules/workflow/templates/WorkflowInfo.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getHeadline: function () {
                    return self.model.get('headline') || "";
                },
                getBody: function () {
                    return self.model.get('body') || "";
                },
                getMessageType: function () {
                    return self.model.get('messageType') || "";
                },
                getButton: function () {
                    return self.model.get('button') || "";
                },
                getSteps: function () {
                    return self.model.get('steps') || "";
                },
                getImage: function () {
                    return self.model.get('image') || "";
                }
            };
        },
        initialize: function (options) {
            var self = this;
            this.$el.on('click', '#button', _.bind(self.onPress, this));
            this.controller = options.controller;
        },
        onPress: function (event) {
            Logger.info("Button pressed");
            this.controller.signal(this.model.get("signal"));
            event.stopPropagation();
        }
    });
});
