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
    'tpl!modules/workflow/templates/WorkflowQuestion.html'
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
                getSteps: function () {
                    return self.model.get('steps') || "";
                },
                getSelectionType: function () {
                    return self.model.get('selectionType') || "radio";
                },
                getButton: function () {
                    return self.model.get('button') || "";
                },
                getCheckState: function (index) {
                    var checked = "";
                    if (!_.isUndefined(self.model.get('validSignals')[index]["default"])) {
                        checked = self.model.get('validSignals')[index]["default"] === "true" ? "checked" : "";
                    }
                    return checked;
                }
            };
        },
        initialize: function (options) {
            var self = this;
            this.$el.on('click', '.button', _.bind(self.onPress, this));
            this.$el.on('click', '.testClick', _.bind(self.onPress, this));
            this.controller = options.controller;
        },
        onRender: function () {
            var self = this;
            this.$('#continueBtn').hide();
            this.$('input[type="radio"]').bind('click', function (e) {
                self.$("#continueBtn").show();
            });
        },
		onPress: function (event) {
			Logger.info("Question:onPress");
            if (event.target.id === "continueBtn") {
                this.controller.signal(this.$("input[name='answer']:checked").val());
            } else {
                this.controller.signal(event.target.id);
            }
            event.stopPropagation();
        }
    });
});
