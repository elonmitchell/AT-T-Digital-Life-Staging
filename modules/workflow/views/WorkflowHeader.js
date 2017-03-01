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
    'jqueryui',
    'underscore',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowHeader.html'
], function (Marionette, jQueryUI, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getHeader: function () {
                    return self.model.get('header') || "";
                },
                showSuspendButton: function () {
                    return self.controller.isSuspendResumeEnabled();
                }
            };
        },
        initialize: function (options) {
            this.controller = options.controller;
        },
        onShow: function () {
            var self = this;
            if (this.controller.isSuspendResumeEnabled()) {
                if (this.model.get('isSuspendButtonHidden') === false) {
                    this.$el.on('click', '#suspend', _.bind(self.onSuspend, this));
                    this.$('#suspend').show();
                } else {
                    this.$('#suspend').hide();
                }
            }
        },
        onSuspend: function (evt) {
            Logger.info("WorkflowHeader : Suspend pressed");
            var self = this;
            window.$("#dialog-confirm").dialog({
                resizable: false,
                height: 140,
                modal: true,
                buttons: [
                    {
                        text: i18n.get('suspend'),
                        click: function () {
                            window.$(this).dialog("destroy");
                            self.controller.event("suspend", {});
                        }
                    },
                    {
                        text: i18n.get('cancel'),
                        click: function () {
                            window.$(this).dialog("destroy");
                        }
                    }]
            });
            evt.stopPropagation();
        }
    });
});
