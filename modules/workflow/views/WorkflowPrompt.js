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
    'tpl!modules/workflow/templates/WorkflowPrompt.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getBody: function () {
                    return self.model.get('body') || "";
                },
                isDefault: function () {
                    return self.model.get('default') !== ("#{" + this.holder + "}");
                },
                isMultiLine: function () {
                    return self.model.get('multiline');
                },
                isPassword: function () {
                    return self.model.get('password');
                },
                getDefault: function () {
                    return self.model.get('default') || "";
                },
                getLabel: function () {
                    return self.model.get('label') || "";
                },
                getType: function () {
                    return self.model.get('inputType') || "text";
                },
                getButton: function () {
                    return self.model.get('button') || "";
                }
            };
        },
        initialize: function (options) {
            var self = this;
            this.$el.on('click', '#button', _.bind(self.onPress, this));
            this.$el.on('keyup', '#prompt', _.bind(self.checkForText, this));
            this.controller = options.controller;
        },
        checkForText: function (event) {
            var text = this.$('#prompt').val();
            this.$('.error').hide();
            if (text.length > 0) {
                // Show continue button
                this.$('#button').show();
            } else {
                // Hide the continue button
                this.$('#button').hide();
            }
        },
        onRender: function () {
            Logger.debug("WorkflowPrompt: onRender");
            this.checkForText();
            this.$('input#prompt').focus();
            this.$('input#prompt').select();
        },
		onPress: function (event) {
			Logger.info("WorkflowPrompt: onPress");
            var data = {},
                regex = null;

            data[this.model.get("holder")] = this.$('#prompt').val();
            if (this.model.attributes.regex !== "") {
                regex = new RegExp(this.model.get("regex"));
            }
            if (regex !== null && this.$('#prompt').val().match(regex) === null) {
                this.$('.error').show();
                this.$('#prompt').focus();
            } else {
                this.controller.signal(this.model.get("signal"), data);
                this.$('.error').hide();
            }
            event.stopPropagation();
        }
    });
});
